"use client";

import { useEffect } from "react";
import { useAssistantApi } from "@assistant-ui/react";

import { Thread } from "@/components/assistant-ui/thread/thread";
import { AppLayout } from "@/components/shared/app-layout";
import { ChatHeaderShare } from "@/components/shared/chat-header-share";
import { ChatHeaderBreadcrumb } from "@/components/shared/chat-header-breadcrumb";
import { IncognitoToggle } from "@/components/shared/incognito-toggle";

type ChatIdContentProps = {
  chatId: string;
  project: { id: string; name: string } | null;
};

export function ChatIdContent({ chatId, project }: ChatIdContentProps) {
  const api = useAssistantApi();

  useEffect(() => {
    api.threads().switchToThread(chatId);
  }, [api, chatId]);

  const headerRight = project ? (
    <ChatHeaderShare />
  ) : (
    <>
      <ChatHeaderShare />
      <IncognitoToggle />
    </>
  );

  return (
    <AppLayout
      headerLeft={<ChatHeaderBreadcrumb project={project} />}
      headerRight={headerRight}
    >
      <Thread />
    </AppLayout>
  );
}
