import type { ResumableStore } from "./types";

// Type definitions for @upstash/redis package (to avoid direct dependency)
interface UpstashRedisClient {
  get<T = string>(key: string): Promise<T | null>;
  set(
    key: string,
    value: string,
    options?: { ex?: number },
  ): Promise<"OK" | null>;
  incr(key: string): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

interface UpstashOptions {
  /**
   * Upstash Redis REST URL.
   * @default process.env.UPSTASH_REDIS_REST_URL
   */
  url?: string;
  /**
   * Upstash Redis REST token.
   * @default process.env.UPSTASH_REDIS_REST_TOKEN
   */
  token?: string;
  /**
   * Pre-configured Upstash Redis client.
   * If provided, `url` and `token` are ignored.
   */
  client?: UpstashRedisClient;
}

/**
 * Creates a Store implementation using the `@upstash/redis` package.
 * This uses Upstash Redis as a simple key-value store with polling-based resumption.
 *
 * Note: Upstash Redis REST API does not support true Pub/Sub, so only the Store
 * interface (polling mode) is available. For real-time synchronization, use
 * a Redis or IORedis PubSub implementation instead.
 *
 * @example
 * ```typescript
 * import { UpstashStore } from 'assistant-stream/resumable/upstash';
 * import { createResumableContext } from 'assistant-stream/resumable';
 *
 * const store = new UpstashStore();
 * const context = createResumableContext({ store });
 * ```
 */
export class UpstashStore implements ResumableStore {
  private client: UpstashRedisClient | null = null;
  private url: string | undefined;
  private token: string | undefined;
  private keyPrefix: string;
  private ttlSeconds: number;

  constructor(
    options: UpstashOptions & {
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
    this.url = options.url ?? process.env["UPSTASH_REDIS_REST_URL"];
    this.token = options.token ?? process.env["UPSTASH_REDIS_REST_TOKEN"];
    this.keyPrefix = options.keyPrefix ?? "aui-resumable";
    this.ttlSeconds = options.ttlSeconds ?? 86400;
    this.client = options.client ?? null;

    if (!this.client && (!this.url || !this.token)) {
      throw new Error(
        "Upstash Redis credentials are required. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables or pass url and token options.",
      );
    }
  }

  private async getClient(): Promise<UpstashRedisClient> {
    if (!this.client) {
      const { Redis } = await import("@upstash/redis");
      this.client = new Redis({
        url: this.url!,
        token: this.token!,
      }) as unknown as UpstashRedisClient;
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
    await client.set(this.stateKey(streamId), state, { ex: ttl });
  }

  async getState(streamId: string): Promise<"active" | "done" | null> {
    const client = await this.getClient();
    const state = await client.get<"active" | "done">(this.stateKey(streamId));
    return state;
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
