"use client";

import {
  AssistantRuntime,
  ThreadHistoryAdapter,
  ThreadMessage,
  MessageFormatAdapter,
  getExternalStoreMessages,
  MessageFormatRepository,
  ExportedMessageRepository,
  INTERNAL,
  useAssistantApi,
  useAssistantState,
} from "@assistant-ui/react";
import { useRef, useEffect, useState, RefObject } from "react";

const { MessageRepository } = INTERNAL;

export const toExportedMessageRepository = <TMessage,>(
  toThreadMessages: (messages: TMessage[]) => ThreadMessage[],
  messages: MessageFormatRepository<TMessage>,
): ExportedMessageRepository => {
  return {
    headId: messages.headId!,
    messages: messages.messages.map((m) => {
      const message = toThreadMessages([m.message])[0]!;
      return {
        ...m,
        message,
      };
    }),
  };
};

export const useExternalHistory = <TMessage,>(
  runtimeRef: RefObject<AssistantRuntime>,
  historyAdapter: ThreadHistoryAdapter | undefined,
  toThreadMessages: (messages: TMessage[]) => ThreadMessage[],
  storageFormatAdapter: MessageFormatAdapter<TMessage, any>,
  onSetMessages: (messages: TMessage[]) => void,
) => {
  const loadedRef = useRef(false);

  const api = useAssistantApi();
  const remoteId = useAssistantState(({ threadListItem }) =>
    api.threadListItem.source ? threadListItem.remoteId : undefined,
  );

  const [isLoading, setIsLoading] = useState(false);

  const historyIds = useRef(new Set<string>());

  const onSetMessagesRef = useRef<typeof onSetMessages>(() => onSetMessages);
  useEffect(() => {
    onSetMessagesRef.current = onSetMessages;
  });

  // Load messages from history adapter on mount
  useEffect(() => {
    if (!historyAdapter || !remoteId || loadedRef.current) return;

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const repo = await historyAdapter
          .withFormat?.(storageFormatAdapter)
          .load();
        if (repo && repo.messages.length > 0) {
          const converted = toExportedMessageRepository(toThreadMessages, repo);
          runtimeRef.current.thread.import(converted);

          const tempRepo = new MessageRepository();
          tempRepo.import(converted);
          const messages = tempRepo.getMessages();

          onSetMessagesRef.current(
            messages.map(getExternalStoreMessages<TMessage>).flat(),
          );

          historyIds.current = new Set(
            converted.messages.map((m) => m.message.id),
          );
        }
      } catch (error) {
        console.error("Failed to load message history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadedRef.current = true;
    loadHistory();
  }, [
    historyAdapter,
    remoteId,
    storageFormatAdapter,
    toThreadMessages,
    runtimeRef,
  ]);

  useEffect(() => {
    if (!historyAdapter) return;

    const saveMessages = async () => {
      const { messages, isRunning } = runtimeRef.current.thread.getState();
      if (isRunning) return;

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]!;
        if (
          message.status === undefined ||
          message.status.type === "complete" ||
          message.status.type === "incomplete"
        ) {
          if (historyIds.current.has(message.id)) continue;
          historyIds.current.add(message.id);

          const parentId = i > 0 ? messages[i - 1]!.id : null;
          await historyAdapter.withFormat?.(storageFormatAdapter).append({
            parentId,
            message: getExternalStoreMessages<TMessage>(message)[0]!,
          });
        }
      }
    };

    // Immediately save any pending messages when historyAdapter becomes available
    saveMessages();

    return runtimeRef.current.thread.subscribe(saveMessages);
  }, [historyAdapter, storageFormatAdapter, runtimeRef]);

  return isLoading;
};
