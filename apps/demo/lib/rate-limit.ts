type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  window?: number;
  /** Maximum requests per window (default: 5) */
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

  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  private startCleanup(): void {
    // Cleanup old entries every 5 minutes
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

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /** Auth-related actions: 5 requests per minute */
  auth: new RateLimiter({ window: 60 * 1000, max: 5 }),
  /** Sensitive actions: 3 requests per minute */
  sensitive: new RateLimiter({ window: 60 * 1000, max: 3 }),
  /** General API: 100 requests per minute */
  api: new RateLimiter({ window: 60 * 1000, max: 100 }),
};

export { RateLimiter };
export type { RateLimitOptions, RateLimitResult };
