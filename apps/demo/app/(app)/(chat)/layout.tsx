import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ChatProvider } from "./provider";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Only wrap with ChatProvider if user is authenticated
  // Unauthenticated users see the landing page without assistant features
  if (session?.user) {
    return <ChatProvider>{children}</ChatProvider>;
  }

  return <>{children}</>;
}
