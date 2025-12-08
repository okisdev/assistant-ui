"use client";

import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import {
  unstable_useCloudThreadListAdapter,
  unstable_useRemoteThreadListRuntime,
  useAssistantState,
  type AssistantRuntime,
} from "@assistant-ui/react";
import { useTanStackAIRuntime } from "./useTanStackAIRuntime";
import type { TanStackChatRuntimeOptions, TanStackUIMessage } from "./types";
import { TanStackChatTransport } from "./TanStackChatTransport";
import { useEffect, useMemo, useRef } from "react";

/**
 * Create a dynamic connection that can be updated
 */
const useDynamicConnection = (transport: TanStackChatTransport) => {
  const transportRef = useRef(transport);

  useEffect(() => {
    transportRef.current = transport;
  });

  const dynamicConnection = useMemo(
    () => ({
      connect: (
        messages: TanStackUIMessage[],
        data?: Record<string, unknown>,
        abortSignal?: AbortSignal,
      ) => transportRef.current.connect(messages, data, abortSignal),
    }),
    [],
  );

  return dynamicConnection;
};

/**
 * Internal hook that creates the thread runtime
 */
const useTanStackChatThreadRuntime = (
  options: Omit<TanStackChatRuntimeOptions, "cloud"> = {},
): AssistantRuntime => {
  const {
    adapters,
    api = "/api/chat",
    initialMessages,
    id: chatId,
    body,
    onResponse,
    onError,
    onFinish,
    cancelPendingToolCallsOnSend,
  } = options;

  // Create transport for context injection
  const transport = useMemo(
    () =>
      new TanStackChatTransport({
        api,
      }),
    [api],
  );

  const connection = useDynamicConnection(transport);

  // Get the current thread ID from assistant-ui state
  const threadId = useAssistantState(({ threadListItem }) => threadListItem.id);

  // Initialize TanStack AI's useChat
  const chat = useChat({
    id: chatId ?? threadId,
    connection,
    initialMessages: initialMessages as Parameters<
      typeof useChat
    >[0]["initialMessages"],
    body,
    onResponse,
    onError,
    onFinish: onFinish as Parameters<typeof useChat>[0]["onFinish"],
  });

  // Create the runtime using our adapter
  const runtime = useTanStackAIRuntime(chat, {
    adapters,
    cancelPendingToolCallsOnSend,
  });

  // Set runtime reference on transport for context access
  transport.setRuntime(runtime);

  return runtime;
};

/**
 * High-level hook that creates a runtime with TanStack AI's useChat,
 * including support for cloud thread management.
 *
 * @param options - Configuration options
 * @returns AssistantRuntime instance
 *
 * @example
 * ```tsx
 * import { useTanStackChatRuntime } from '@assistant-ui/react-tanstack-ai';
 * import { AssistantRuntimeProvider } from '@assistant-ui/react';
 *
 * function App() {
 *   const runtime = useTanStackChatRuntime({
 *     api: '/api/chat',
 *   });
 *
 *   return (
 *     <AssistantRuntimeProvider runtime={runtime}>
 *       {children}
 *     </AssistantRuntimeProvider>
 *   );
 * }
 * ```
 */
export const useTanStackChatRuntime = ({
  cloud,
  ...options
}: TanStackChatRuntimeOptions = {}): AssistantRuntime => {
  const cloudAdapter = unstable_useCloudThreadListAdapter({ cloud });

  return unstable_useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      return useTanStackChatThreadRuntime(options);
    },
    adapter: cloudAdapter,
    allowNesting: true,
  });
};

// Re-export for convenience
export { fetchServerSentEvents } from "@tanstack/ai-react";
