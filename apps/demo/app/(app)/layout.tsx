import { headers } from "next/headers";

import { auth } from "@/lib/auth";
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
    return <ChatProvider>{children}</ChatProvider>;
  }

  return children;
}
