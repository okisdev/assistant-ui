import type {
  ResumableContext,
  ResumableContextOptions,
  ResumablePubSub,
  ResumableStore,
} from "./types";

const DONE_MESSAGE = "\n\n\nDONE_SENTINEL_aui_resumable_stream_done_marker\n";

interface ResumeStreamMessage {
  listenerId: string;
}

/**
 * Creates a ResumableContext using the Store interface (polling mode).
 * Suitable for simpler deployments where real-time sync is not needed.
 */
function createStoreContext(
  store: ResumableStore,
  options: ResumableContextOptions,
): ResumableContext {
  const ttlSeconds = options.ttlSeconds ?? 86400;
  const waitUntil = options.waitUntil ?? ((p) => p);

  return {
    async resumableStream(
      streamId: string,
      makeStream: () => ReadableStream<string>,
    ): Promise<ReadableStream<string> | null> {
      const state = await store.getState(streamId);

      if (state === "done") {
        return null;
      }

      if (state === "active") {
        // Stream exists, resume it
        return this.resumeStream(streamId);
      }

      // Create new stream
      return this.createStream(streamId, makeStream);
    },

    async createStream(
      streamId: string,
      makeStream: () => ReadableStream<string>,
    ): Promise<ReadableStream<string> | null> {
      // Check if stream already exists
      const existingState = await store.getState(streamId);
      if (existingState === "done") {
        return null;
      }

      // Mark as active
      await store.setState(streamId, "active", ttlSeconds);

      const sourceStream = makeStream();
      const reader = sourceStream.getReader();

      // Create a promise that resolves when the stream is done
      let streamDoneResolver: () => void;
      const streamDonePromise = new Promise<void>((resolve) => {
        streamDoneResolver = resolve;
      });
      waitUntil(streamDonePromise);

      return new ReadableStream<string>({
        async pull(controller) {
          try {
            const { done, value } = await reader.read();

            if (done) {
              await store.setState(streamId, "done", ttlSeconds);
              controller.close();
              streamDoneResolver();
              return;
            }

            // Buffer the chunk
            await store.appendChunk(streamId, value);
            controller.enqueue(value);
          } catch (error) {
            controller.error(error);
            streamDoneResolver();
          }
        },
        cancel() {
          reader.cancel();
          streamDoneResolver();
        },
      });
    },

    async resumeStream(
      streamId: string,
    ): Promise<ReadableStream<string> | null> {
      const state = await store.getState(streamId);

      if (state === null) {
        return null;
      }

      if (state === "done") {
        // Return all chunks as a completed stream
        const { chunks } = await store.getChunks(streamId, 0);
        return new ReadableStream<string>({
          start(controller) {
            for (const chunk of chunks) {
              controller.enqueue(chunk);
            }
            controller.close();
          },
        });
      }

      // Stream is active, poll for new chunks
      let currentIndex = 0;
      const pollIntervalMs = 100;

      return new ReadableStream<string>({
        async pull(controller) {
          // Poll until we get new chunks or stream is done
          while (true) {
            const { chunks, isDone } = await store.getChunks(
              streamId,
              currentIndex,
            );

            if (chunks.length > 0) {
              for (const chunk of chunks) {
                controller.enqueue(chunk);
              }
              currentIndex += chunks.length;
            }

            if (isDone) {
              controller.close();
              return;
            }

            // If no new chunks, wait before polling again
            if (chunks.length === 0) {
              await new Promise((resolve) =>
                setTimeout(resolve, pollIntervalMs),
              );
            } else {
              // Got chunks, check for more immediately
              return;
            }
          }
        },
      });
    },

    async hasStream(streamId: string): Promise<null | true | "done"> {
      const state = await store.getState(streamId);
      if (state === null) return null;
      if (state === "done") return "done";
      return true;
    },

    createResponse(streamId: string, stream: ReadableStream<string>): Response {
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Stream-Id": streamId,
        },
      });
    },
  };
}

/**
 * Creates a ResumableContext using the PubSub interface (real-time mode).
 * Suitable for multi-user scenarios where real-time sync is needed.
 */
function createPubSubContext(
  pubsub: ResumablePubSub,
  options: ResumableContextOptions,
): ResumableContext {
  const keyPrefix = options.keyPrefix ?? "aui-resumable";
  const ttlSeconds = options.ttlSeconds ?? 86400;
  const waitUntil = options.waitUntil ?? ((p) => p);

  const sentinelKey = (streamId: string) => `${keyPrefix}:sentinel:${streamId}`;
  const requestChannel = (streamId: string) =>
    `${keyPrefix}:request:${streamId}`;
  const chunkChannel = (listenerId: string) =>
    `${keyPrefix}:chunk:${listenerId}`;

  return {
    async resumableStream(
      streamId: string,
      makeStream: () => ReadableStream<string>,
    ): Promise<ReadableStream<string> | null> {
      // Use INCR to atomically determine if we're the first or a subsequent consumer
      const count = await pubsub.incr(sentinelKey(streamId)).catch((error) => {
        const errorString = String(error);
        if (errorString.includes("ERR value is not an integer")) {
          return "done" as const;
        }
        throw error;
      });

      if (count === "done") {
        return null;
      }

      if (count > 1) {
        // We're a subsequent consumer, resume the stream
        return this.resumeStream(streamId);
      }

      // We're the first consumer, create the stream
      return this.createStream(streamId, makeStream);
    },

    async createStream(
      streamId: string,
      makeStream: () => ReadableStream<string>,
    ): Promise<ReadableStream<string> | null> {
      // Set sentinel to indicate stream is active
      await pubsub.set(sentinelKey(streamId), "1", { exSeconds: ttlSeconds });

      const chunks: string[] = [];
      const listenerChannels: string[] = [];
      let isDone = false;

      // Create a promise that resolves when the stream is done
      let streamDoneResolver: () => void;
      const streamDonePromise = new Promise<void>((resolve) => {
        streamDoneResolver = resolve;
      });
      waitUntil(streamDonePromise);

      // Listen for resume requests
      await pubsub.subscribe(requestChannel(streamId), async (message) => {
        const { listenerId } = JSON.parse(message) as ResumeStreamMessage;
        listenerChannels.push(listenerId);

        // Send buffered chunks to the new listener
        const bufferedContent = chunks.join("");
        if (bufferedContent) {
          await pubsub.publish(chunkChannel(listenerId), bufferedContent);
        }

        // If stream is already done, send done message
        if (isDone) {
          await pubsub.publish(chunkChannel(listenerId), DONE_MESSAGE);
        }
      });

      const sourceStream = makeStream();
      const reader = sourceStream.getReader();

      return new ReadableStream<string>({
        async pull(controller) {
          try {
            const { done, value } = await reader.read();

            if (done) {
              isDone = true;

              // Mark sentinel as done
              await pubsub.set(sentinelKey(streamId), "done", {
                exSeconds: ttlSeconds,
              });

              // Unsubscribe from request channel
              await pubsub.unsubscribe(requestChannel(streamId));

              // Send done message to all listeners
              await Promise.all(
                listenerChannels.map((listenerId) =>
                  pubsub.publish(chunkChannel(listenerId), DONE_MESSAGE),
                ),
              );

              controller.close();
              streamDoneResolver();
              return;
            }

            // Buffer the chunk
            chunks.push(value);

            // Send to all listeners
            await Promise.all(
              listenerChannels.map((listenerId) =>
                pubsub.publish(chunkChannel(listenerId), value),
              ),
            );

            controller.enqueue(value);
          } catch (error) {
            controller.error(error);
            streamDoneResolver();
          }
        },
        cancel() {
          reader.cancel();
          streamDoneResolver();
        },
      });
    },

    async resumeStream(
      streamId: string,
    ): Promise<ReadableStream<string> | null> {
      const state = await pubsub.get(sentinelKey(streamId));

      if (state === null) {
        return null;
      }

      if (state === "done") {
        // Stream completed - return empty stream to signal completion
        // The client can use any messages it already has
        return new ReadableStream<string>({
          start(controller) {
            controller.close();
          },
        });
      }

      const listenerId = crypto.randomUUID();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(async () => {
          await pubsub.unsubscribe(chunkChannel(listenerId));
          // Check if stream finished while we were waiting
          const currentState = await pubsub.get(sentinelKey(streamId));
          if (currentState === "done") {
            resolve(null);
          } else {
            reject(new Error("Timeout waiting for stream producer"));
          }
        }, 5000);

        const stream = new ReadableStream<string>({
          async start(controller) {
            await pubsub.subscribe(chunkChannel(listenerId), (message) => {
              clearTimeout(timeout);

              if (message === DONE_MESSAGE) {
                controller.close();
                pubsub.unsubscribe(chunkChannel(listenerId));
                return;
              }

              controller.enqueue(message);
            });

            // Request to join the stream
            await pubsub.publish(
              requestChannel(streamId),
              JSON.stringify({ listenerId }),
            );

            // Resolve with the stream once subscription is set up
            resolve(stream);
          },
        });
      });
    },

    async hasStream(streamId: string): Promise<null | true | "done"> {
      const state = await pubsub.get(sentinelKey(streamId));
      if (state === null) return null;
      if (state === "done") return "done";
      return true;
    },

    createResponse(streamId: string, stream: ReadableStream<string>): Response {
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Stream-Id": streamId,
        },
      });
    },
  };
}

/**
 * Creates a ResumableContext from the given options.
 * Automatically chooses between Store mode (polling) and PubSub mode (real-time)
 * based on the provided options.
 */
export function createResumableContextFromOptions(
  options: ResumableContextOptions,
): ResumableContext {
  if (options.pubsub) {
    return createPubSubContext(options.pubsub, options);
  }

  if (options.store) {
    return createStoreContext(options.store, options);
  }

  throw new Error(
    "ResumableContext requires either a store or pubsub implementation",
  );
}
