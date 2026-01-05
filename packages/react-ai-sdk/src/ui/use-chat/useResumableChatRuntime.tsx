"use client";

import { ResumableStateManager } from "@assistant-ui/react/resumable";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ResumableChatTransport } from "./ResumableChatTransport";
import { useChatRuntime, type UseChatRuntimeOptions } from "./useChatRuntime";

export interface UseResumableChatRuntimeOptions<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends Omit<UseChatRuntimeOptions<UI_MESSAGE>, "transport" | "messages"> {
  /**
   * The API endpoint for chat requests.
   * @default "/api/chat"
   */
  api?: string;

  /**
   * The API endpoint for resuming streams.
   * Defaults to `${api}/resume` if not provided.
   */
  resumeApi?: string;

  /**
   * Initial messages to display.
   * These will be merged with any restored messages from resumption.
   */
  initialMessages?: UI_MESSAGE[];

  /**
   * Callback when stream resumption starts.
   */
  onResumeStart?: () => void;

  /**
   * Callback when stream resumption succeeds.
   * @param wasInterrupted - Whether the original response was interrupted
   */
  onResumeSuccess?: (wasInterrupted: boolean) => void;

  /**
   * Callback when stream resumption fails.
   * @param error - The error that occurred
   */
  onResumeError?: (error: Error) => void;
}

/**
 * Hook for creating a chat runtime with built-in resumable stream support.
 * Automatically handles saving and restoring stream state across page refreshes.
 *
 * @example
 * ```typescript
 * // Simple usage
 * const runtime = useResumableChatRuntime({
 *   api: '/api/chat',
 * });
 *
 * // With callbacks
 * const runtime = useResumableChatRuntime({
 *   api: '/api/chat',
 *   onResumeStart: () => setLoading(true),
 *   onResumeSuccess: (wasInterrupted) => {
 *     setLoading(false);
 *     if (wasInterrupted) {
 *       toast('Session restored (response was interrupted)');
 *     } else {
 *       toast('Session restored successfully');
 *     }
 *   },
 *   onResumeError: (error) => {
 *     setLoading(false);
 *     toast.error(`Failed to resume: ${error.message}`);
 *   },
 * });
 * ```
 */
/**
 * Extract text content from a UIMessage.
 */
function extractTextFromMessage(message: UIMessage): string {
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts.filter(
      (p): p is { type: "text"; text: string } =>
        p.type === "text" && typeof (p as { text?: unknown }).text === "string",
    );
    return textParts.map((p) => p.text).join("");
  }
  const content = (message as unknown as { content?: string }).content;
  if (typeof content === "string") {
    return content;
  }
  return "";
}

/**
 * State for resumed messages with streaming support.
 */
interface ResumedState {
  userMessage: UIMessage | null;
  assistantMessage: UIMessage | null;
  isStreaming: boolean;
}

export function useResumableChatRuntime<
  UI_MESSAGE extends UIMessage = UIMessage,
>({
  api = "/api/chat",
  resumeApi,
  initialMessages,
  onResumeStart,
  onResumeSuccess,
  onResumeError,
  ...options
}: UseResumableChatRuntimeOptions<UI_MESSAGE> = {}) {
  const stateManager = useMemo(
    () => new ResumableStateManager<UIMessage>(),
    [],
  );

  // State for resumed messages (separate from runtime messages)
  const [resumedState, setResumedState] = useState<ResumedState>({
    userMessage: null,
    assistantMessage: null,
    isStreaming: false,
  });

  // Check for pending stream SYNCHRONOUSLY during initial render
  const pendingStreamRef = useRef<{
    streamId: string;
    messages: UIMessage[];
  } | null>(null);
  const [isResuming, setIsResuming] = useState(() => {
    const pending = stateManager.getPendingStream();
    if (pending) {
      pendingStreamRef.current = pending;
      return true;
    }
    return false;
  });

  // Create initial user message from pending stream (synchronously)
  const initialUserMessage = useMemo(() => {
    if (!pendingStreamRef.current) return null;
    const lastMessage =
      pendingStreamRef.current.messages[
        pendingStreamRef.current.messages.length - 1
      ];
    if (!lastMessage) return null;

    const userText = extractTextFromMessage(lastMessage);
    if (!userText) return null;

    return {
      id: `restored-user-${Date.now()}`,
      role: "user" as const,
      parts: [{ type: "text" as const, text: userText }],
    } as UIMessage;
  }, []);

  // Compute initial messages for runtime
  const effectiveInitialMessages = useMemo(() => {
    const initial = (initialMessages ?? []) as UIMessage[];
    if (initialUserMessage) {
      return [...initial, initialUserMessage] as UI_MESSAGE[];
    }
    return initial.length > 0 ? (initial as UI_MESSAGE[]) : undefined;
  }, [initialMessages, initialUserMessage]);

  const transport = useMemo(
    () =>
      new ResumableChatTransport({
        api,
        stateManager: stateManager as ResumableStateManager<UI_MESSAGE>,
      }),
    [api, stateManager],
  );

  // Create runtime
  const runtime = useChatRuntime({
    ...options,
    transport,
    messages: effectiveInitialMessages,
  } as UseChatRuntimeOptions<UI_MESSAGE>);

  // Set runtime on transport
  useEffect(() => {
    transport.setRuntime(runtime);
  }, [transport, runtime]);

  // Stream from resume endpoint
  const streamResumedContent = useCallback(async (resumeEndpoint: string) => {
    console.log("[streamResumedContent] Fetching:", resumeEndpoint);
    const response = await fetch(resumeEndpoint);
    console.log("[streamResumedContent] Response status:", response.status);

    if (!response.ok) {
      throw new Error(`Resume failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let accumulatedText = "";

    console.log("[streamResumedContent] Starting to read stream...");

    // Create initial assistant message
    setResumedState((prev) => ({
      ...prev,
      assistantMessage: {
        id: `restored-assistant-${Date.now()}`,
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "" }],
      },
      isStreaming: true,
    }));

    try {
      while (true) {
        const { done, value } = await reader.read();
        console.log("[streamResumedContent] Read chunk, done:", done);
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        console.log("[streamResumedContent] Raw chunk:", chunk);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          console.log("[streamResumedContent] JSON:", jsonStr);
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const data = JSON.parse(jsonStr);
            console.log("[streamResumedContent] Parsed data:", data);
            if (data.type === "text-delta" && data.delta) {
              accumulatedText += data.delta;
              console.log(
                "[streamResumedContent] Accumulated:",
                accumulatedText,
              );

              // Update assistant message with accumulated text
              setResumedState((prev) => ({
                ...prev,
                assistantMessage: {
                  id:
                    prev.assistantMessage?.id ??
                    `restored-assistant-${Date.now()}`,
                  role: "assistant" as const,
                  parts: [{ type: "text" as const, text: accumulatedText }],
                },
              }));
            }
          } catch (e) {
            console.log("[streamResumedContent] Parse error:", e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log("[streamResumedContent] Final accumulated:", accumulatedText);
    return accumulatedText;
  }, []);

  // Resume streaming on mount
  const hasAttemptedResumeRef = useRef(false);
  useEffect(() => {
    if (hasAttemptedResumeRef.current) return;
    if (!pendingStreamRef.current) return;

    hasAttemptedResumeRef.current = true;
    const { streamId } = pendingStreamRef.current;
    const resumeEndpoint = resumeApi ?? `${api}/resume/${streamId}`;

    onResumeStart?.();

    // Set initial state with user message
    if (initialUserMessage) {
      setResumedState((prev) => ({
        ...prev,
        userMessage: initialUserMessage,
      }));
    }

    streamResumedContent(resumeEndpoint)
      .then((aiText) => {
        setResumedState((prev) => ({
          ...prev,
          isStreaming: false,
        }));

        const wasInterrupted = !aiText;
        setIsResuming(false);
        onResumeSuccess?.(wasInterrupted);

        // Clear state after successful resume
        stateManager.clearAll();
      })
      .catch((error: Error) => {
        console.error("[useResumableChatRuntime] Resume failed:", error);

        // Show interrupted message on error
        setResumedState((prev) => ({
          ...prev,
          assistantMessage: {
            id: `restored-assistant-${Date.now()}`,
            role: "assistant" as const,
            parts: [
              { type: "text" as const, text: "(Response was interrupted)" },
            ],
          },
          isStreaming: false,
        }));

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
    initialUserMessage,
    streamResumedContent,
  ]);

  // Combine resumed assistant message with runtime
  // The user message is already in the runtime's initial messages
  const resumedAssistantMessage = resumedState.assistantMessage;
  const isStreamingResume = resumedState.isStreaming;

  return {
    runtime,
    isResuming,
    isStreamingResume,
    resumedAssistantMessage,
    stateManager,
  };
}
