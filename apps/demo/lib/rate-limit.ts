import { ApiError } from "@/lib/error";
import { redis } from "@/lib/redis";

type RateLimitOptions = {
  window?: number;
  max?: number;
  prefix?: string;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

const DEFAULT_WINDOW = 60 * 1000;
const DEFAULT_MAX = 5;
const KEY_PREFIX = "rl:";

class RateLimiter {
  private window: number;
  private max: number;
  private prefix: string;

  constructor(options: RateLimitOptions = {}) {
    this.window = options.window ?? DEFAULT_WINDOW;
    this.max = options.max ?? DEFAULT_MAX;
    this.prefix = options.prefix ?? "";
  }

  private getKey(identifier: string): string {
    return `${KEY_PREFIX}${this.prefix}${identifier}`;
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier);
    const now = Date.now();
    const windowSeconds = Math.ceil(this.window / 1000);

    const results = await redis
      .pipeline()
      .incr(key)
      .pttl(key)
      .exec<[number, number]>();

    const count = results[0];
    const ttl = results[1];

    if (ttl === -1) {
      await redis.pexpire(key, this.window);
    }

    const resetAt = ttl > 0 ? now + ttl : now + windowSeconds * 1000;

    if (count > this.max) {
      return { success: false, remaining: 0, resetAt };
    }

    return {
      success: true,
      remaining: this.max - count,
      resetAt,
    };
  }

  async checkOrThrow(identifier: string): Promise<RateLimitResult> {
    const result = await this.check(identifier);
    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      throw ApiError.rateLimit(
        `Rate limit exceeded. Retry after ${retryAfter}s`,
      );
    }
    return result;
  }

  async checkOrRespond(identifier: string): Promise<Response | null> {
    const result = await this.check(identifier);
    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(this.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      });
    }
    return null;
  }

  async reset(identifier: string): Promise<void> {
    await redis.del(this.getKey(identifier));
  }
}

export const rateLimiters = {
  auth: new RateLimiter({ window: 60 * 1000, max: 5, prefix: "auth:" }),
  sensitive: new RateLimiter({ window: 60 * 1000, max: 3, prefix: "sens:" }),
  api: new RateLimiter({ window: 60 * 1000, max: 100, prefix: "api:" }),
  chat: new RateLimiter({ window: 60 * 1000, max: 30, prefix: "chat:" }),
  imageGeneration: new RateLimiter({
    window: 60 * 1000,
    max: 10,
    prefix: "img:",
  }),
};

export { RateLimiter };
export type { RateLimitOptions, RateLimitResult };
