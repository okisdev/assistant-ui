import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { api } from "@/utils/trpc/server";
import { ChatPageSetter } from "@/components/app/chat/chat-page-setter";

export async function generateMetadata(
  props: PageProps<"/chat/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const chat = await api.chat.get({ id });

  return {
    title: chat?.title || "New Chat",
  };
}

export default async function ChatPage(props: PageProps<"/chat/[id]">) {
  const { id } = await props.params;

  const session = await getSession();

  if (!session) {
    redirect(`/auth?redirect=${encodeURIComponent(`/chat/${id}`)}`);
  }

  const chat = await api.chat.get({ id });

  if (!chat) {
    notFound();
  }

  // Fetch project info if chat belongs to a project
  const project = chat.projectId
    ? await api.project.get({ id: chat.projectId })
    : null;

  // ChatPageSetter sets the context state, ChatContent (in provider) handles the UI
  return (
    <ChatPageSetter
      chatId={id}
      project={project ? { id: project.id, name: project.name } : null}
    />
  );
}
