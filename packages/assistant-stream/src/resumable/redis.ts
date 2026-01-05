import type { ResumablePubSub, ResumableStore } from "./types";

// Type definitions for redis package (to avoid direct dependency)
interface RedisClientType {
  connect(): Promise<void>;
  duplicate(): RedisClientType;
  publish(channel: string, message: string): Promise<number>;
  subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
  set(
    key: string,
    value: string,
    options?: { EX?: number },
  ): Promise<string | null>;
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  rPush(key: string, value: string): Promise<number>;
  lRange(key: string, start: number, stop: number): Promise<string[]>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

interface RedisOptions {
  /**
   * Redis connection URL.
   * @default process.env.REDIS_URL
   */
  url?: string;
  /**
   * Pre-configured Redis client for publishing.
   * If provided, `url` is ignored.
   */
  publisher?: RedisClientType;
  /**
   * Pre-configured Redis client for subscribing.
   * If provided, `url` is ignored.
   */
  subscriber?: RedisClientType;
}

/**
 * Creates a PubSub implementation using the `redis` package (node-redis).
 * This enables real-time stream synchronization across multiple server instances.
 *
 * @example
 * ```typescript
 * import { createRedisPubSub } from 'assistant-stream/resumable/redis';
 * import { createResumableContext } from 'assistant-stream/resumable';
 *
 * const context = createResumableContext({
 *   pubsub: createRedisPubSub({ url: process.env.REDIS_URL }),
 * });
 * ```
 */
export function createRedisPubSub(options: RedisOptions = {}): ResumablePubSub {
  const url = options.url ?? process.env["REDIS_URL"];

  if (!url && !options.publisher) {
    throw new Error(
      "Redis URL is required. Set REDIS_URL environment variable or pass url option.",
    );
  }

  // Lazy load redis to avoid requiring it if not used
  let redis: typeof import("redis") | null = null;
  let publisher: RedisClientType | null = options.publisher ?? null;
  let subscriber: RedisClientType | null = options.subscriber ?? null;

  const getRedis = async () => {
    if (!redis) {
      redis = await import("redis");
    }
    return redis;
  };

  let publisherConnected = false;
  let subscriberConnected = false;

  const getPublisher = async (): Promise<RedisClientType> => {
    if (!publisher) {
      if (!url) {
        throw new Error("Redis URL is required to create a publisher");
      }
      const r = await getRedis();
      publisher = r.createClient({ url }) as unknown as RedisClientType;
    }
    if (!publisherConnected) {
      await publisher.connect().catch(() => {});
      publisherConnected = true;
    }
    return publisher;
  };

  const getSubscriber = async (): Promise<RedisClientType> => {
    if (!subscriber) {
      const pub = await getPublisher();
      subscriber = pub.duplicate();
    }
    if (!subscriberConnected) {
      await subscriber.connect().catch(() => {});
      subscriberConnected = true;
    }
    return subscriber;
  };

  return {
    async connect(): Promise<void> {
      // getPublisher and getSubscriber now handle connection automatically
      await Promise.all([getPublisher(), getSubscriber()]);
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
      await sub.subscribe(channel, callback);
    },

    async unsubscribe(channel: string): Promise<void> {
      const sub = await getSubscriber();
      await sub.unsubscribe(channel);
    },

    async set(
      key: string,
      value: string,
      options?: { exSeconds?: number },
    ): Promise<void> {
      const pub = await getPublisher();
      await pub.set(
        key,
        value,
        options?.exSeconds ? { EX: options.exSeconds } : undefined,
      );
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
 * Creates a Store implementation using the `redis` package (node-redis).
 * This uses Redis as a simple key-value store with polling-based resumption.
 *
 * @example
 * ```typescript
 * import { RedisStore } from 'assistant-stream/resumable/redis';
 * import { createResumableContext } from 'assistant-stream/resumable';
 *
 * const store = new RedisStore({ url: process.env.REDIS_URL });
 * const context = createResumableContext({ store });
 * ```
 */
export class RedisStore implements ResumableStore {
  private client: RedisClientType | null = null;
  private url: string;
  private keyPrefix: string;
  private ttlSeconds: number;

  constructor(
    options: RedisOptions & {
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

  private async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      const redis = await import("redis");
      this.client = redis.createClient({
        url: this.url,
      }) as unknown as RedisClientType;
      await this.client.connect();
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
    await client.set(this.stateKey(streamId), state, { EX: ttl });
  }

  async getState(streamId: string): Promise<"active" | "done" | null> {
    const client = await this.getClient();
    const state = await client.get(this.stateKey(streamId));
    return state as "active" | "done" | null;
  }

  async appendChunk(streamId: string, chunk: string): Promise<void> {
    const client = await this.getClient();
    await client.rPush(this.chunksKey(streamId), chunk);
    await client.expire(this.chunksKey(streamId), this.ttlSeconds);
  }

  async getChunks(
    streamId: string,
    fromIndex: number = 0,
  ): Promise<{ chunks: string[]; isDone: boolean }> {
    const client = await this.getClient();
    const [chunks, state] = await Promise.all([
      client.lRange(this.chunksKey(streamId), fromIndex, -1),
      this.getState(streamId),
    ]);
    return {
      chunks,
      isDone: state === "done",
    };
  }

  async cleanup(streamId: string): Promise<void> {
    const client = await this.getClient();
    await Promise.all([
      client.del(this.stateKey(streamId)),
      client.del(this.chunksKey(streamId)),
    ]);
  }
}
