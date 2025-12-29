import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { api } from "@/utils/trpc/server";
import { ChatProvider } from "./(chat)/provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    const [profile, capabilities] = await Promise.all([
      api.user.profile.get(),
      api.user.capability.list(),
    ]);

    return (
      <ChatProvider initialProfile={profile} initialCapabilities={capabilities}>
        {children}
      </ChatProvider>
    );
  }

  return children;
}
