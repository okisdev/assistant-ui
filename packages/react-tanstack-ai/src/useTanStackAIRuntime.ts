"use client";

import { useState, useMemo } from "react";
import {
  useExternalStoreRuntime,
  useRuntimeAdapters,
  INTERNAL,
  type AssistantRuntime,
  type ThreadMessage,
  type ToolExecutionStatus,
} from "@assistant-ui/react";
import type {
  TanStackChatHelpers,
  TanStackAIRuntimeOptions,
  TanStackUIMessage,
} from "./types";
import {
  TanStackMessageConverter,
  getTanStackMessages,
} from "./convertTanStackMessages";
import { toCreateMessage } from "./utils/toCreateMessage";
import { sliceMessagesUntil } from "./utils/sliceMessagesUntil";

/**
 * Runtime hook that bridges TanStack AI's useChat with assistant-ui
 *
 * @param chatHelpers - Return value from TanStack AI's useChat hook
 * @param options - Configuration options
 * @returns AssistantRuntime instance
 */
export const useTanStackAIRuntime = (
  chatHelpers: TanStackChatHelpers,
  {
    adapters,
    cancelPendingToolCallsOnSend = true,
  }: TanStackAIRuntimeOptions = {},
): AssistantRuntime => {
  const contextAdapters = useRuntimeAdapters();
  const isRunning = chatHelpers.isLoading;

  const [toolStatuses, setToolStatuses] = useState<
    Record<string, ToolExecutionStatus>
  >({});

  // Convert TanStack AI messages to assistant-ui format
  const messages = TanStackMessageConverter.useThreadMessages({
    isRunning,
    messages: chatHelpers.messages as TanStackUIMessage[],
    metadata: useMemo(
      () => ({
        toolStatuses,
        ...(chatHelpers.error && { error: chatHelpers.error.message }),
      }),
      [toolStatuses, chatHelpers.error],
    ),
  });

  const [runtimeRef] = useState(() => ({
    get current(): AssistantRuntime {
      return runtime;
    },
  }));

  // Handle tool invocations for frontend tools
  const toolInvocations = INTERNAL.useToolInvocations({
    state: {
      messages,
      isRunning,
    },
    getTools: () => runtimeRef.current.thread.getModelContext().tools,
    onResult: (command) => {
      if (command.type === "add-tool-result") {
        chatHelpers.addToolResult({
          tool: command.toolName,
          toolCallId: command.toolCallId,
          output: command.result,
        });
      }
    },
    setToolStatuses,
  });

  /**
   * Cancel pending tool calls that are awaiting user input
   */
  const completePendingToolCalls = () => {
    if (!cancelPendingToolCallsOnSend) return;

    const pendingToolCallIds = Object.entries(toolStatuses)
      .filter(
        (
          entry,
        ): entry is [
          string,
          Extract<ToolExecutionStatus, { type: "interrupt" }>,
        ] => entry[1]?.type === "interrupt",
      )
      .map(([toolCallId]) => toolCallId);

    if (pendingToolCallIds.length === 0) return;

    // Mark tool calls as cancelled
    setToolStatuses((prev) => {
      const next = { ...prev };
      pendingToolCallIds.forEach((toolCallId) => {
        next[toolCallId] = {
          type: "cancelled",
          reason: "User cancelled tool call by sending a new message.",
        };
      });
      return next;
    });
  };

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
    setMessages: (newMessages) => {
      const tanstackMessages = newMessages
        .map(getTanStackMessages<TanStackUIMessage>)
        .filter(Boolean)
        .flat();
      chatHelpers.setMessages(tanstackMessages);
    },
    onImport: (newMessages) => {
      const tanstackMessages = newMessages
        .map(getTanStackMessages<TanStackUIMessage>)
        .filter(Boolean)
        .flat();
      chatHelpers.setMessages(tanstackMessages);
    },
    onCancel: async () => {
      chatHelpers.stop();
      toolInvocations.abort();
    },
    onNew: async (message) => {
      completePendingToolCalls();

      const content = toCreateMessage(message);
      await chatHelpers.sendMessage(content);
    },
    onEdit: async (message) => {
      completePendingToolCalls();

      const tanstackMessages = chatHelpers.messages as TanStackUIMessage[];
      const newMessages = sliceMessagesUntil(
        tanstackMessages,
        message.parentId,
      );
      chatHelpers.setMessages(newMessages);

      const content = toCreateMessage(message);
      await chatHelpers.sendMessage(content);
    },
    onReload: async (parentId: string | null) => {
      completePendingToolCalls();

      const tanstackMessages = chatHelpers.messages as TanStackUIMessage[];
      const newMessages = sliceMessagesUntil(tanstackMessages, parentId);
      chatHelpers.setMessages(newMessages);

      await chatHelpers.reload();
    },
    onAddToolResult: ({ toolCallId, result, isError }) => {
      chatHelpers.addToolResult({
        tool: toolCallId,
        toolCallId,
        output: result,
        ...(isError && { state: "output-error" as const }),
      });
    },
    adapters: {
      ...contextAdapters,
      ...adapters,
    },
  });

  return runtime;
};
