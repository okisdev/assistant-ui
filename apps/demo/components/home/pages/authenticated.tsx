"use client";

import { Thread } from "@/components/assistant-ui/thread/thread";
import { AppLayout } from "@/components/shared/app-layout";
import { ChatHeaderShare } from "@/components/shared/chat-header-share";
import { ChatHeaderTitle } from "@/components/shared/chat-header-title";
import { IncognitoToggle } from "@/components/shared/incognito-toggle";
import { useSyncThreadUrl } from "@/hooks/use-sync-thread-url";
import { useIncognitoOptional } from "@/hooks/use-incognito";
import { authClient } from "@/lib/auth.client";
import { api } from "@/utils/trpc/client";

function HeaderRight() {
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;

  return (
    <>
      {!isIncognito && <ChatHeaderShare />}
      <IncognitoToggle />
    </>
  );
}

export function HomeAuthenticatedPage() {
  useSyncThreadUrl();

  const { data: session } = authClient.useSession();
  const { data: profile } = api.user.getProfile.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;

  const displayName = profile?.nickname || profile?.name;
  const welcomeMessage = isIncognito
    ? "Incognito chat - your conversation won't be saved"
    : displayName
      ? `What can I help you with, ${displayName}?`
      : "What can I help you with?";

  return (
    <AppLayout
      headerLeft={!isIncognito ? <ChatHeaderTitle /> : undefined}
      headerRight={<HeaderRight />}
    >
      <Thread welcomeMessage={welcomeMessage} />
    </AppLayout>
  );
}
