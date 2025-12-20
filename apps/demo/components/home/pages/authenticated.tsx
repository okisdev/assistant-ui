"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { AppLayout } from "@/components/shared/app-layout";
import { authClient } from "@/lib/auth.client";
import { api } from "@/utils/trpc/client";

export function HomeAuthenticatedPage() {
  const { data: session } = authClient.useSession();
  const { data: profile } = api.user.getProfile.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const displayName = profile?.nickname || profile?.name;
  const welcomeMessage = displayName
    ? `What can I help you with, ${displayName}?`
    : "What can I help you with?";

  return (
    <AppLayout>
      <Thread welcomeMessage={welcomeMessage} />
    </AppLayout>
  );
}
