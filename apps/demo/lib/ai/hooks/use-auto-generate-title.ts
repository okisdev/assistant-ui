"use client";

import { useAssistantApi } from "@assistant-ui/react";
import { useEffect, useRef } from "react";
import { api } from "@/utils/trpc/client";

export function useAutoGenerateTitle() {
  const assistantApi = useAssistantApi();
  const utils = api.useUtils();
  const generatedThreads = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribe = assistantApi.on(
      "thread.run-end",
      async ({ threadId }) => {
        try {
          const threadState = assistantApi.thread().getState();
          const messages = threadState.messages;

          if (!threadId || generatedThreads.current.has(threadId)) return;
          if (messages.length < 2) return;

          const threadItem = assistantApi.threads().item({ id: threadId });
          const currentTitle = threadItem.getState().title;
          if (currentTitle && currentTitle !== "New Chat") return;

          generatedThreads.current.add(threadId);

          const { title } = await utils.client.chat.generateTitle.mutate({
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          });

          if (title) {
            threadItem.rename(title);
          }
        } catch (error) {
          console.error("Failed to generate title:", error);
        }
      },
    );

    return unsubscribe;
  }, [assistantApi, utils]);
}
