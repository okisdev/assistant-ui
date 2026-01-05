const STREAM_ID_KEY = "aui-resumable-stream-id";
const MESSAGES_KEY = "aui-resumable-messages";

/**
 * Manages client-side state for resumable streams.
 * Uses localStorage to persist stream ID and messages across page refreshes.
 *
 * @template TMessage - The message type used by your application
 *
 * @example
 * ```typescript
 * // With AI SDK UIMessage
 * const stateManager = new ResumableStateManager<UIMessage>();
 *
 * // With custom message type
 * interface MyMessage { id: string; content: string; }
 * const stateManager = new ResumableStateManager<MyMessage>();
 * ```
 */
export class ResumableStateManager<TMessage = unknown> {
  private storage: Storage | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.storage = window.localStorage;
    }
  }

  /**
   * Get the pending stream ID, if any.
   */
  getStreamId(): string | null {
    return this.storage?.getItem(STREAM_ID_KEY) ?? null;
  }

  /**
   * Set the pending stream ID.
   */
  setStreamId(streamId: string): void {
    this.storage?.setItem(STREAM_ID_KEY, streamId);
  }

  /**
   * Clear the pending stream ID.
   */
  clearStreamId(): void {
    this.storage?.removeItem(STREAM_ID_KEY);
  }

  /**
   * Get stored messages for resumption.
   */
  getMessages(): TMessage[] | null {
    const stored = this.storage?.getItem(MESSAGES_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as TMessage[];
    } catch {
      return null;
    }
  }

  /**
   * Store messages for resumption.
   */
  setMessages(messages: TMessage[]): void {
    this.storage?.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }

  /**
   * Clear stored messages.
   */
  clearMessages(): void {
    this.storage?.removeItem(MESSAGES_KEY);
  }

  /**
   * Clear all resumable state.
   */
  clearAll(): void {
    this.clearStreamId();
    this.clearMessages();
  }

  /**
   * Check if there's a pending stream to resume.
   */
  hasPendingStream(): boolean {
    return !!this.getStreamId() && !!this.getMessages();
  }

  /**
   * Get pending stream info for resumption.
   */
  getPendingStream(): { streamId: string; messages: TMessage[] } | null {
    const streamId = this.getStreamId();
    const messages = this.getMessages();

    if (!streamId || !messages || messages.length === 0) {
      return null;
    }

    return { streamId, messages };
  }
}
