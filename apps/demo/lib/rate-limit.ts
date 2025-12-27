import { ApiError } from "@/lib/error";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  window?: number;
  max?: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

const DEFAULT_WINDOW = 60 * 1000;
const DEFAULT_MAX = 5;

class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private window: number;
  private max: number;

  constructor(options: RateLimitOptions = {}) {
    this.window = options.window ?? DEFAULT_WINDOW;
    this.max = options.max ?? DEFAULT_MAX;
    this.startCleanup();
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now > record.resetAt) {
      const resetAt = now + this.window;
      this.store.set(identifier, { count: 1, resetAt });
      return { success: true, remaining: this.max - 1, resetAt };
    }

    if (record.count >= this.max) {
      return { success: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    return {
      success: true,
      remaining: this.max - record.count,
      resetAt: record.resetAt,
    };
  }

  checkOrThrow(identifier: string): RateLimitResult {
    const result = this.check(identifier);
    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      throw ApiError.rateLimit(
        `Rate limit exceeded. Retry after ${retryAfter}s`,
      );
    }
    return result;
  }

  checkOrRespond(identifier: string): Response | null {
    const result = this.check(identifier);
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

  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  private startCleanup(): void {
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, value] of this.store.entries()) {
          if (now > value.resetAt) {
            this.store.delete(key);
          }
        }
      },
      5 * 60 * 1000,
    );
  }
}

export const rateLimiters = {
  auth: new RateLimiter({ window: 60 * 1000, max: 5 }),
  sensitive: new RateLimiter({ window: 60 * 1000, max: 3 }),
  api: new RateLimiter({ window: 60 * 1000, max: 100 }),
  chat: new RateLimiter({ window: 60 * 1000, max: 30 }),
  imageGeneration: new RateLimiter({ window: 60 * 1000, max: 10 }),
};

export { RateLimiter };
export type { RateLimitOptions, RateLimitResult };
