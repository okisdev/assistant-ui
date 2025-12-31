"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  FeedbackAdapter,
  useAssistantApi,
  useAssistantState,
} from "@assistant-ui/react";
import { api } from "@/utils/trpc/client";

export function useFeedbackAdapter(): FeedbackAdapter | undefined {
  const threadListItem = useAssistantState(
    ({ threadListItem }) => threadListItem,
  );
  const utils = api.useUtils();
  const chatId = threadListItem.remoteId;

  const submit = useCallback<FeedbackAdapter["submit"]>(
    ({ message, type }) => {
      if (!chatId) return;
      utils.client.chat.vote.submit.mutate({
        chatId,
        messageId: message.id,
        type,
      });
    },
    [chatId, utils],
  );

  if (!chatId) return undefined;

  return { submit };
}

export function useSyncFeedback() {
  const assistantApi = useAssistantApi();
  const threadListItem = useAssistantState(
    ({ threadListItem }) => threadListItem,
  );
  const messages = useAssistantState(({ thread }) => thread.messages);
  const isRunning = useAssistantState(({ thread }) => thread.isRunning);
  const utils = api.useUtils();

  const chatId = threadListItem.remoteId;
  const syncedRef = useRef<Set<string>>(new Set());
  const lastChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (chatId !== lastChatIdRef.current) {
      syncedRef.current = new Set();
      lastChatIdRef.current = chatId ?? null;
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId || isRunning || messages.length === 0) return;

    const syncFeedback = async () => {
      const unsynced = messages.filter(
        (m) =>
          m.role === "assistant" &&
          !syncedRef.current.has(m.id) &&
          !m.metadata?.submittedFeedback,
      );

      if (unsynced.length === 0) return;

      try {
        const dbMessages = await utils.chat.message.list.fetch({ chatId });

        const feedbackMap = new Map<string, "positive" | "negative">();
        for (const m of dbMessages) {
          const metadata = m.metadata as {
            submittedFeedback?: { type: "positive" | "negative" };
          } | null;
          if (metadata?.submittedFeedback) {
            feedbackMap.set(m.id, metadata.submittedFeedback.type);
          }
        }

        const threadApi = assistantApi.thread();
        for (const msg of unsynced) {
          const feedbackType = feedbackMap.get(msg.id);
          if (feedbackType) {
            threadApi
              .message({ id: msg.id })
              .submitFeedback({ type: feedbackType });
          }
          syncedRef.current.add(msg.id);
        }
      } catch (error) {
        console.error("Failed to sync feedback:", error);
      }
    };

    syncFeedback();
  }, [chatId, messages, isRunning, assistantApi, utils]);
}
