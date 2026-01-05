export type {
  ResumableContext,
  ResumableContextOptions,
  ResumablePubSub,
  ResumableStore,
  ResumableStreamResult,
} from "./types";

export { MemoryStore } from "./stores/MemoryStore";
export { createResumableContextFromOptions } from "./ResumableContext";

import type { ResumableContext, ResumableContextOptions } from "./types";
import { MemoryStore } from "./stores/MemoryStore";
import { createResumableContextFromOptions } from "./ResumableContext";

/**
 * Creates a ResumableContext with automatic environment detection.
 *
 * Priority:
 * 1. If `store` or `pubsub` is provided in options, use that
 * 2. If `REDIS_URL` environment variable is set, use Redis (requires separate import)
 * 3. Fall back to MemoryStore (single-server mode)
 *
 * @example
 * ```typescript
 * // Simplest usage - auto-detects environment
 * const context = createResumableContext();
 *
 * // With explicit MemoryStore
 * const context = createResumableContext({
 *   store: new MemoryStore({ ttlMs: 60_000 }),
 * });
 *
 * // With Redis (requires assistant-stream/resumable/redis)
 * import { createRedisPubSub } from 'assistant-stream/resumable/redis';
 * const context = createResumableContext({
 *   pubsub: createRedisPubSub(),
 * });
 * ```
 */
export function createResumableContext(
  options: ResumableContextOptions = {},
): ResumableContext {
  // If user provided store or pubsub, use that
  if (options.store || options.pubsub) {
    return createResumableContextFromOptions(options);
  }

  // Check for REDIS_URL environment variable
  const redisUrl =
    typeof process !== "undefined" ? process.env["REDIS_URL"] : undefined;

  if (redisUrl) {
    // Log that Redis is available but dynamic import is needed
    console.log(
      "[assistant-stream/resumable] REDIS_URL detected. For Redis support, import from 'assistant-stream/resumable/redis':",
    );
    console.log(
      "  import { createRedisPubSub } from 'assistant-stream/resumable/redis';",
    );
    console.log("  const context = createResumableContext({");
    console.log("    pubsub: createRedisPubSub(),");
    console.log("  });");
    console.log(
      "[assistant-stream/resumable] Falling back to MemoryStore (single-server mode)",
    );
  }

  // Default to MemoryStore
  const ttlMs = options.ttlSeconds ? options.ttlSeconds * 1000 : 60_000;
  return createResumableContextFromOptions({
    ...options,
    store: new MemoryStore({ ttlMs }),
  });
}
