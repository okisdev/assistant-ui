import type { ResumablePubSub, ResumableStore } from "./types";

// Type definitions for ioredis package (to avoid direct dependency)
interface IORedisClient {
  connect(): Promise<void>;
  duplicate(): IORedisClient;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string): Promise<number>;
  unsubscribe(channel: string): Promise<number>;
  on(
    event: "message",
    callback: (channel: string, message: string) => void,
  ): void;
  set(key: string, value: string): Promise<"OK" | null>;
  setex(key: string, seconds: number, value: string): Promise<"OK">;
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

interface IORedisOptions {
  /**
   * Redis connection URL.
   * @default process.env.REDIS_URL
   */
  url?: string;
  /**
   * Pre-configured IORedis client for publishing.
   * If provided, `url` is ignored.
   */
  publisher?: IORedisClient;
  /**
   * Pre-configured IORedis client for subscribing.
   * If provided, `url` is ignored.
   */
  subscriber?: IORedisClient;
}

/**
 * Creates a PubSub implementation using the `ioredis` package.
 * This enables real-time stream synchronization across multiple server instances.
 *
 * @example
 * ```typescript
 * import { createIORedisPubSub } from 'assistant-stream/resumable/ioredis';
 * import { createResumableContext } from 'assistant-stream/resumable';
 *
 * const context = createResumableContext({
 *   pubsub: createIORedisPubSub({ url: process.env.REDIS_URL }),
 * });
 * ```
 */
export function createIORedisPubSub(
  options: IORedisOptions = {},
): ResumablePubSub {
  const url = options.url ?? process.env["REDIS_URL"];

  if (!url && !options.publisher) {
    throw new Error(
      "Redis URL is required. Set REDIS_URL environment variable or pass url option.",
    );
  }

  let publisher: IORedisClient | null = options.publisher ?? null;
  let subscriber: IORedisClient | null = options.subscriber ?? null;
  const subscriptions = new Map<string, (message: string) => void>();

  const getPublisher = async (): Promise<IORedisClient> => {
    if (!publisher) {
      const IORedis = (await import("ioredis")).default;
      publisher = new IORedis(url!) as unknown as IORedisClient;
    }
    return publisher;
  };

  const getSubscriber = async (): Promise<IORedisClient> => {
    if (!subscriber) {
      const pub = await getPublisher();
      subscriber = pub.duplicate();

      // Set up message handler
      subscriber.on("message", (channel: string, message: string) => {
        const callback = subscriptions.get(channel);
        if (callback) {
          callback(message);
        }
      });
    }
    return subscriber;
  };

  let connected = false;

  return {
    async connect(): Promise<void> {
      if (connected) return;

      await Promise.all([getPublisher(), getSubscriber()]);
      connected = true;
    },

    async publish(channel: string, message: string): Promise<void> {
      const pub = await getPublisher();
      await pub.publish(channel, message);
    },

    async subscribe(
      channel: string,
      callback: (message: string) => void,
    ): Promise<void> {
      const sub = await getSubscriber();
      subscriptions.set(channel, callback);
      await sub.subscribe(channel);
    },

    async unsubscribe(channel: string): Promise<void> {
      const sub = await getSubscriber();
      subscriptions.delete(channel);
      await sub.unsubscribe(channel);
    },

    async set(
      key: string,
      value: string,
      options?: { exSeconds?: number },
    ): Promise<void> {
      const pub = await getPublisher();
      if (options?.exSeconds) {
        await pub.setex(key, options.exSeconds, value);
      } else {
        await pub.set(key, value);
      }
    },

    async get(key: string): Promise<string | null> {
      const pub = await getPublisher();
      return pub.get(key);
    },

    async incr(key: string): Promise<number> {
      const pub = await getPublisher();
      return pub.incr(key);
    },
  };
}

/**
 * Creates a Store implementation using the `ioredis` package.
 * This uses Redis as a simple key-value store with polling-based resumption.
 *
 * @example
 * ```typescript
 * import { IORedisStore } from 'assistant-stream/resumable/ioredis';
 * import { createResumableContext } from 'assistant-stream/resumable';
 *
 * const store = new IORedisStore({ url: process.env.REDIS_URL });
 * const context = createResumableContext({ store });
 * ```
 */
export class IORedisStore implements ResumableStore {
  private client: IORedisClient | null = null;
  private url: string;
  private keyPrefix: string;
  private ttlSeconds: number;

  constructor(
    options: IORedisOptions & {
      /**
       * Prefix for Redis keys.
       * @default "aui-resumable"
       */
      keyPrefix?: string;
      /**
       * TTL for stream data in seconds.
       * @default 86400 (24 hours)
       */
      ttlSeconds?: number;
    } = {},
  ) {
    const url = options.url ?? process.env["REDIS_URL"];
    if (!url && !options.publisher) {
      throw new Error(
        "Redis URL is required. Set REDIS_URL environment variable or pass url option.",
      );
    }
    this.url = url!;
    this.keyPrefix = options.keyPrefix ?? "aui-resumable";
    this.ttlSeconds = options.ttlSeconds ?? 86400;
    this.client = options.publisher ?? null;
  }

  private async getClient(): Promise<IORedisClient> {
    if (!this.client) {
      const IORedis = (await import("ioredis")).default;
      this.client = new IORedis(this.url) as unknown as IORedisClient;
    }
    return this.client;
  }

  private stateKey(streamId: string): string {
    return `${this.keyPrefix}:state:${streamId}`;
  }

  private chunksKey(streamId: string): string {
    return `${this.keyPrefix}:chunks:${streamId}`;
  }

  async setState(
    streamId: string,
    state: "active" | "done",
    ttlSeconds?: number,
  ): Promise<void> {
    const client = await this.getClient();
    const ttl = ttlSeconds ?? this.ttlSeconds;
    await client.setex(this.stateKey(streamId), ttl, state);
  }

  async getState(streamId: string): Promise<"active" | "done" | null> {
    const client = await this.getClient();
    const state = await client.get(this.stateKey(streamId));
    return state as "active" | "done" | null;
  }

  async appendChunk(streamId: string, chunk: string): Promise<void> {
    const client = await this.getClient();
    await client.rpush(this.chunksKey(streamId), chunk);
    await client.expire(this.chunksKey(streamId), this.ttlSeconds);
  }

  async getChunks(
    streamId: string,
    fromIndex: number = 0,
  ): Promise<{ chunks: string[]; isDone: boolean }> {
    const client = await this.getClient();
    const [chunks, state] = await Promise.all([
      client.lrange(this.chunksKey(streamId), fromIndex, -1),
      this.getState(streamId),
    ]);
    return {
      chunks,
      isDone: state === "done",
    };
  }

  async cleanup(streamId: string): Promise<void> {
    const client = await this.getClient();
    await client.del(this.stateKey(streamId), this.chunksKey(streamId));
  }
}
