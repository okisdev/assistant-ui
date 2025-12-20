"use client";

import { ChatProvider } from "./provider";

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ChatProvider>{children}</ChatProvider>;
}
