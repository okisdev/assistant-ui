"use client";

import { useLayoutEffect, useRef } from "react";
import { useAssistantApi } from "@assistant-ui/react";

import { Thread } from "@/components/assistant-ui/thread/thread";
import { AppLayout } from "@/components/shared/app-layout";
import { ChatHeaderShare } from "@/components/shared/chat-header-share";
import { ChatHeaderTitle } from "@/components/shared/chat-header-title";
import { ChatHeaderBreadcrumb } from "@/components/shared/chat-header-breadcrumb";
import { IncognitoToggle } from "@/components/shared/incognito-toggle";
import { useSyncThreadUrl } from "@/hooks/use-sync-thread-url";
import { useNavigation } from "@/contexts/navigation-provider";
import { useIncognitoOptional } from "@/contexts/incognito-provider";
import { useInitialProfile } from "@/app/(app)/(chat)/provider";

function HeaderRight() {
  const { chatId, chatProject } = useNavigation();
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;

  // On chat page with project, don't show incognito toggle
  if (chatId && chatProject) {
    return <ChatHeaderShare />;
  }

  return (
    <>
      {!isIncognito && <ChatHeaderShare />}
      <IncognitoToggle />
    </>
  );
}

function HeaderLeft() {
  const { chatId, chatProject } = useNavigation();
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;

  // On chat detail page, show breadcrumb (which includes title)
  if (chatId) {
    return <ChatHeaderBreadcrumb project={chatProject} />;
  }

  // On home page, show title only if not incognito
  if (!isIncognito) {
    return <ChatHeaderTitle />;
  }

  return null;
}

function useWelcomeMessage(): string | undefined {
  const { chatId } = useNavigation();
  const profile = useInitialProfile();
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;

  // On chat detail page, no welcome message needed
  if (chatId) {
    return undefined;
  }

  // On home page
  const displayName = profile?.nickname || profile?.name;
  if (isIncognito) {
    return "Incognito chat - your conversation won't be saved";
  }
  return displayName
    ? `What can I help you with, ${displayName}?`
    : "What can I help you with?";
}

export function ChatContent() {
  const assistantApi = useAssistantApi();
  const { chatId } = useNavigation();
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;
  const prevChatIdRef = useRef<string | null | undefined>(undefined);

  // Sync URL when on home page
  useSyncThreadUrl();

  // Switch to thread before paint to avoid flash
  useLayoutEffect(() => {
    if (isIncognito) {
      prevChatIdRef.current = chatId;
      return;
    }

    // If chatId changed from a value to null, switch to new thread (going back to home)
    if (prevChatIdRef.current && !chatId) {
      assistantApi.threads().switchToNewThread();
    }
    // If chatId has a value, switch to that thread
    else if (chatId) {
      assistantApi.threads().switchToThread(chatId);
    }

    prevChatIdRef.current = chatId;
  }, [chatId, assistantApi, isIncognito]);

  const welcomeMessage = useWelcomeMessage();

  return (
    <AppLayout headerLeft={<HeaderLeft />} headerRight={<HeaderRight />}>
      <Thread welcomeMessage={welcomeMessage} />
    </AppLayout>
  );
}
