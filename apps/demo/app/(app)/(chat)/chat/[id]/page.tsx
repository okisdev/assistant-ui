import { notFound } from "next/navigation";

import { api } from "@/utils/trpc/server";
import { ChatIdContent } from "@/components/app/chat/id/content";

export default async function ChatPage(props: PageProps<"/chat/[id]">) {
  const { id } = await props.params;

  const chat = await api.chat.get({ id });

  if (!chat) {
    notFound();
  }

  return <ChatIdContent chatId={id} />;
}
