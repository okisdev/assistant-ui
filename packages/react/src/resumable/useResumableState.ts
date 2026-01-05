"use client";

import { useEffect, useMemo, useState } from "react";
import { ResumableStateManager } from "./ResumableStateManager";

/**
 * Options for the useResumableState hook.
 */
export interface UseResumableStateOptions<TMessage> {
  /**
   * The API endpoint for chat requests.
   */
  api: string;

  /**
   * The API endpoint for resuming streams.
   * If a function, receives the streamId and should return the full URL.
   * If a string, the streamId will be appended as a path segment.
   * @default `${api}/resume/${streamId}`
   */
  resumeApi?: string | ((streamId: string) => string);

  /**
   * Callback when stream resumption starts.
   */
  onResumeStart?: () => void;

  /**
   * Callback when stream resumption succeeds.
   * @param response - The response from the resume endpoint
   */
  onResumeSuccess?: (response: Response) => void;

  /**
   * Callback when stream resumption fails.
   * @param error - The error that occurred
   */
  onResumeError?: (error: Error) => void;

  /**
   * Custom state manager instance.
   * If not provided, a new instance will be created.
   */
  stateManager?: ResumableStateManager<TMessage>;
}

/**
 * Result of the useResumableState hook.
 */
export interface UseResumableStateResult<TMessage> {
  /**
   * The state manager instance for managing resumable state.
   */
  stateManager: ResumableStateManager<TMessage>;

  /**
   * Whether the hook is currently attempting to resume a stream.
   */
  isResuming: boolean;

  /**
   * The response from the resume endpoint, if resumption was successful.
   * This is the raw Response object that can be used to read the stream.
   */
  resumedResponse: Response | null;

  /**
   * The messages that were stored before the page refresh.
   * Only available after successful resumption.
   */
  storedMessages: TMessage[] | null;
}

/**
 * Hook for managing resumable stream state.
 * Handles detecting pending streams on mount and attempting to resume them.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const {
 *     stateManager,
 *     isResuming,
 *     resumedResponse,
 *     storedMessages,
 *   } = useResumableState<MyMessage>({
 *     api: '/api/chat',
 *     onResumeStart: () => console.log('Resuming...'),
 *     onResumeSuccess: (response) => console.log('Resumed!', response),
 *     onResumeError: (error) => console.error('Failed:', error),
 *   });
 *
 *   if (isResuming) {
 *     return <div>Resuming previous session...</div>;
 *   }
 *
 *   // Use resumedResponse to read the stream
 *   // Use storedMessages to get the messages from before the refresh
 * }
 * ```
 */
export function useResumableState<TMessage = unknown>(
  options: UseResumableStateOptions<TMessage>,
): UseResumableStateResult<TMessage> {
  const { api, resumeApi, onResumeStart, onResumeSuccess, onResumeError } =
    options;

  const [isResuming, setIsResuming] = useState(false);
  const [resumedResponse, setResumedResponse] = useState<Response | null>(null);
  const [storedMessages, setStoredMessages] = useState<TMessage[] | null>(null);

  const stateManager = useMemo(
    () => options.stateManager ?? new ResumableStateManager<TMessage>(),
    [options.stateManager],
  );

  useEffect(() => {
    const pending = stateManager.getPendingStream();

    if (!pending) {
      return;
    }

    const { streamId, messages } = pending;

    // Build resume URL
    let resumeUrl: string;
    if (typeof resumeApi === "function") {
      resumeUrl = resumeApi(streamId);
    } else if (resumeApi) {
      resumeUrl = `${resumeApi}/${streamId}`;
    } else {
      resumeUrl = `${api}/resume/${streamId}`;
    }

    setIsResuming(true);
    onResumeStart?.();

    fetch(resumeUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Resume failed: ${response.status}`);
        }

        setResumedResponse(response);
        setStoredMessages(messages);
        setIsResuming(false);
        onResumeSuccess?.(response);

        // Clear state after successful resume
        stateManager.clearAll();
      })
      .catch((error: Error) => {
        console.error("[useResumableState] Failed to resume:", error);
        setIsResuming(false);
        onResumeError?.(error);

        // Clear state on error
        stateManager.clearAll();
      });
  }, [
    api,
    resumeApi,
    stateManager,
    onResumeStart,
    onResumeSuccess,
    onResumeError,
  ]);

  return {
    stateManager,
    isResuming,
    resumedResponse,
    storedMessages,
  };
}
