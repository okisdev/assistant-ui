"use client";

import { usePathname } from "next/navigation";
import { Thread } from "@/components/assistant-ui/thread/thread";
import { AppLayout } from "@/components/shared/app-layout";
import { ChatHeaderShare } from "@/components/shared/chat-header-share";
import { ChatHeaderTitle } from "@/components/shared/chat-header-title";
import { ChatHeaderBreadcrumb } from "@/components/shared/chat-header-breadcrumb";
import { IncognitoToggle } from "@/components/shared/incognito-toggle";
import { useSyncThreadUrl } from "@/hooks/use-sync-thread-url";
import { useSyncChatThread } from "@/hooks/use-sync-chat-thread";
import { useNavigation } from "@/contexts/navigation-provider";
import { useIncognitoOptional } from "@/contexts/incognito-provider";
import { useInitialProfile } from "@/app/(app)/(chat)/provider";

function HeaderRight() {
  const { chatId, chatProject } = useNavigation();
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;

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

  if (chatId) {
    return <ChatHeaderBreadcrumb project={chatProject} />;
  }

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

  if (chatId) {
    return undefined;
  }

  const displayName = profile?.nickname || profile?.name;
  if (isIncognito) {
    return "Incognito chat - your conversation won't be saved";
  }
  return displayName
    ? `What can I help you with, ${displayName}?`
    : "What can I help you with?";
}

export function ChatContent() {
  const pathname = usePathname();
  const { isChatPageInitialized } = useNavigation();
  const welcomeMessage = useWelcomeMessage();

  useSyncThreadUrl();
  useSyncChatThread();

  const isChatDetailPage =
    pathname.startsWith("/chat/") && pathname !== "/chat";

  if (isChatDetailPage && !isChatPageInitialized) {
    return null;
  }

  return (
    <AppLayout headerLeft={<HeaderLeft />} headerRight={<HeaderRight />}>
      <Thread welcomeMessage={welcomeMessage} />
    </AppLayout>
  );
}
