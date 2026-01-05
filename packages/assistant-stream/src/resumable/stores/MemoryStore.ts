import type { ResumableStore } from "../types";

interface StreamData {
  state: "active" | "done";
  chunks: string[];
  expiresAt: number;
}

/**
 * In-memory implementation of ResumableStore.
 * Suitable for single-server deployments and development.
 *
 * Note: Data is lost on server restart and is not shared across
 * multiple server instances.
 */
export class MemoryStore implements ResumableStore {
  private streams = new Map<string, StreamData>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private options: {
      /**
       * Time-to-live for stream data in milliseconds.
       * @default 60000 (1 minute)
       */
      ttlMs?: number;
      /**
       * Interval for cleaning up expired streams in milliseconds.
       * @default 30000 (30 seconds)
       */
      cleanupIntervalMs?: number;
    } = {},
  ) {
    const cleanupIntervalMs = options.cleanupIntervalMs ?? 30_000;

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, cleanupIntervalMs);

    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private get ttlMs(): number {
    return this.options.ttlMs ?? 60_000;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [streamId, data] of this.streams) {
      if (now > data.expiresAt) {
        this.streams.delete(streamId);
      }
    }
  }

  async setState(
    streamId: string,
    state: "active" | "done",
    ttlSeconds?: number,
  ): Promise<void> {
    const ttlMs = ttlSeconds ? ttlSeconds * 1000 : this.ttlMs;
    const existing = this.streams.get(streamId);

    this.streams.set(streamId, {
      state,
      chunks: existing?.chunks ?? [],
      expiresAt: Date.now() + ttlMs,
    });
  }

  async getState(streamId: string): Promise<"active" | "done" | null> {
    const data = this.streams.get(streamId);
    if (!data) return null;

    // Check if expired
    if (Date.now() > data.expiresAt) {
      this.streams.delete(streamId);
      return null;
    }

    return data.state;
  }

  async appendChunk(streamId: string, chunk: string): Promise<void> {
    const data = this.streams.get(streamId);
    if (data) {
      data.chunks.push(chunk);
      // Extend TTL on activity
      data.expiresAt = Date.now() + this.ttlMs;
    }
  }

  async getChunks(
    streamId: string,
    fromIndex: number = 0,
  ): Promise<{ chunks: string[]; isDone: boolean }> {
    const data = this.streams.get(streamId);
    if (!data) {
      return { chunks: [], isDone: false };
    }

    // Check if expired
    if (Date.now() > data.expiresAt) {
      this.streams.delete(streamId);
      return { chunks: [], isDone: false };
    }

    return {
      chunks: data.chunks.slice(fromIndex),
      isDone: data.state === "done",
    };
  }

  async cleanup(streamId: string): Promise<void> {
    this.streams.delete(streamId);
  }

  /**
   * Stop the cleanup interval. Call this when shutting down.
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
