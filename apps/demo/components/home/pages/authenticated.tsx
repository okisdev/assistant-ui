"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { AppLayout } from "@/components/shared/app-layout";
import { ChatHeaderShare } from "@/components/shared/chat-header-share";
import { ChatHeaderTitle } from "@/components/shared/chat-header-title";
import { useSyncThreadUrl } from "@/hooks/use-sync-thread-url";
import { authClient } from "@/lib/auth.client";
import { api } from "@/utils/trpc/client";

export function HomeAuthenticatedPage() {
  useSyncThreadUrl();

  const { data: session } = authClient.useSession();
  const { data: profile } = api.user.getProfile.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const displayName = profile?.nickname || profile?.name;
  const welcomeMessage = displayName
    ? `What can I help you with, ${displayName}?`
    : "What can I help you with?";

  return (
    <AppLayout
      headerLeft={<ChatHeaderTitle />}
      headerRight={<ChatHeaderShare />}
    >
      <Thread welcomeMessage={welcomeMessage} />
    </AppLayout>
  );
}
