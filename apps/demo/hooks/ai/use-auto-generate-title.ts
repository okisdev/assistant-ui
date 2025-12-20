"use client";

import { useAssistantApi } from "@assistant-ui/react";
import { useEffect, useRef } from "react";

export function useAutoGenerateTitle() {
  const api = useAssistantApi();
  const generatedThreads = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribe = api.on("thread.run-end", async ({ threadId }) => {
      try {
        const threadState = api.thread().getState();
        const messages = threadState.messages;

        // Skip if no threadId or already generated
        if (!threadId || generatedThreads.current.has(threadId)) return;
        if (messages.length < 2) return; // Need at least user + assistant message

        // Check if thread already has a real title
        const threadItem = api.threads().item({ id: threadId });
        const currentTitle = threadItem.getState().title;
        if (currentTitle && currentTitle !== "New Chat") return;

        generatedThreads.current.add(threadId);

        const response = await fetch("/api/chat/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });

        if (!response.ok) return;

        const { title } = await response.json();
        if (title) {
          threadItem.rename(title);
        }
      } catch (error) {
        console.error("Failed to generate title:", error);
      }
    });

    return unsubscribe;
  }, [api]);
}
