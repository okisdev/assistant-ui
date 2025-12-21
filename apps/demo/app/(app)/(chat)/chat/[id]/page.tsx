import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { api } from "@/utils/trpc/server";
import { ChatIdContent } from "@/components/app/chat/id/content";

export default async function ChatPage(props: PageProps<"/chat/[id]">) {
  const { id } = await props.params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/auth?redirect=${encodeURIComponent(`/chat/${id}`)}`);
  }

  const chat = await api.chat.get({ id });

  if (!chat) {
    notFound();
  }

  return <ChatIdContent chatId={id} />;
}
