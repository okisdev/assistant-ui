"use client";

import { useEffect } from "react";
import { useAssistantApi } from "@assistant-ui/react";

import { Thread } from "@/components/assistant-ui/thread";
import { AppLayout } from "@/components/shared/app-layout";
import { ChatHeaderShare } from "@/components/shared/chat-header-share";
import { ChatHeaderTitle } from "@/components/shared/chat-header-title";

export function ChatIdContent({ chatId }: { chatId: string }) {
  const api = useAssistantApi();

  useEffect(() => {
    api.threads().switchToThread(chatId);
  }, [api, chatId]);

  return (
    <AppLayout
      headerLeft={<ChatHeaderTitle />}
      headerRight={<ChatHeaderShare />}
    >
      <Thread />
    </AppLayout>
  );
}
