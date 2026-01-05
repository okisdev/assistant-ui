/**
 * Store interface for polling-based resumable streams.
 * Suitable for any backend: Memory, Redis, Upstash, PostgreSQL, etc.
 */
export interface ResumableStore {
  /**
   * Set the state of a stream.
   */
  setState(
    streamId: string,
    state: "active" | "done",
    ttlSeconds?: number,
  ): Promise<void>;

  /**
   * Get the current state of a stream.
   * Returns null if the stream doesn't exist.
   */
  getState(streamId: string): Promise<"active" | "done" | null>;

  /**
   * Append a chunk to the stream buffer.
   */
  appendChunk(streamId: string, chunk: string): Promise<void>;

  /**
   * Get chunks from a stream, optionally starting from a specific index.
   */
  getChunks(
    streamId: string,
    fromIndex?: number,
  ): Promise<{
    chunks: string[];
    isDone: boolean;
  }>;

  /**
   * Clean up a stream's data.
   */
  cleanup(streamId: string): Promise<void>;
}

/**
 * PubSub interface for real-time resumable streams.
 * Suitable for Redis-like backends that support Pub/Sub.
 */
export interface ResumablePubSub {
  /**
   * Connect to the pubsub backend.
   */
  connect(): Promise<void>;

  /**
   * Publish a message to a channel.
   */
  publish(channel: string, message: string): Promise<void>;

  /**
   * Subscribe to a channel.
   */
  subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void>;

  /**
   * Unsubscribe from a channel.
   */
  unsubscribe(channel: string): Promise<void>;

  /**
   * Set a key-value pair with optional TTL.
   */
  set(
    key: string,
    value: string,
    options?: { exSeconds?: number },
  ): Promise<void>;

  /**
   * Get a value by key.
   */
  get(key: string): Promise<string | null>;

  /**
   * Increment a numeric value.
   */
  incr(key: string): Promise<number>;
}

/**
 * Options for creating a resumable context.
 */
export interface ResumableContextOptions {
  /**
   * Store implementation for polling-based resumable streams.
   * Use this for simpler deployments or when real-time sync is not needed.
   */
  store?: ResumableStore;

  /**
   * PubSub implementation for real-time resumable streams.
   * Use this for multi-user scenarios (e.g., group chat) where
   * multiple clients need to see the same stream in real-time.
   */
  pubsub?: ResumablePubSub;

  /**
   * Prefix for keys/channels used by the resumable context.
   * @default "aui-resumable"
   */
  keyPrefix?: string;

  /**
   * Time-to-live for stream data in seconds.
   * @default 86400 (24 hours)
   */
  ttlSeconds?: number;

  /**
   * Function to ensure the current execution context stays alive
   * until the promise resolves. Required for serverless environments.
   * In Next.js, use the `after` function from `next/server`.
   */
  waitUntil?: (promise: Promise<unknown>) => void;
}

/**
 * Result of creating a resumable stream.
 */
export interface ResumableStreamResult {
  /**
   * The stream to return to the client.
   */
  stream: ReadableStream<string>;

  /**
   * The unique ID of this stream.
   */
  streamId: string;
}

/**
 * Context for managing resumable streams.
 */
export interface ResumableContext {
  /**
   * Create a new resumable stream or resume an existing one.
   * This is the idempotent API - it will create a new stream if one doesn't exist,
   * or resume an existing stream if it does.
   *
   * @param streamId - Unique identifier for the stream
   * @param makeStream - Factory function to create the stream (only called if new)
   * @returns The stream, or null if the stream is already done
   */
  resumableStream(
    streamId: string,
    makeStream: () => ReadableStream<string>,
  ): Promise<ReadableStream<string> | null>;

  /**
   * Create a new resumable stream.
   *
   * @param streamId - Unique identifier for the stream
   * @param makeStream - Factory function to create the stream
   * @returns The stream, or null if a stream with this ID already exists and is done
   */
  createStream(
    streamId: string,
    makeStream: () => ReadableStream<string>,
  ): Promise<ReadableStream<string> | null>;

  /**
   * Resume an existing stream.
   *
   * @param streamId - Unique identifier for the stream
   * @returns The stream, null if done, or undefined if stream doesn't exist
   */
  resumeStream(streamId: string): Promise<ReadableStream<string> | null>;

  /**
   * Check if a stream exists.
   *
   * @param streamId - Unique identifier for the stream
   * @returns null if doesn't exist, true if active, "done" if completed
   */
  hasStream(streamId: string): Promise<null | true | "done">;

  /**
   * Create a Response object with the appropriate headers for a resumable stream.
   *
   * @param streamId - Unique identifier for the stream
   * @param stream - The stream to wrap (from createStream or resumableStream)
   * @returns A Response object with the stream and appropriate headers
   */
  createResponse(streamId: string, stream: ReadableStream<string>): Response;
}
