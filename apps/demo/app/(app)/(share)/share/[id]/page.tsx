import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessagesSquare, ArrowRight } from "lucide-react";

import { api } from "@/utils/trpc/server";
import {
  SharedThread,
  SharedSingleMessage,
} from "@/components/app/share/id/thread";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function generateMetadata(
  props: PageProps<"/share/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const data = await api.share.getPublic({ id });

  if (
    !data ||
    (data.resource.type !== "chat" && data.resource.type !== "message")
  ) {
    return { title: "Share" };
  }

  const isMessageShare = data.resource.type === "message";
  const title = isMessageShare
    ? "Shared Response"
    : data.resource.chat.title || "Shared Chat";

  return { title };
}

export default async function SharePage(props: PageProps<"/share/[id]">) {
  const { id } = await props.params;

  const data = await api.share.getPublic({ id });

  if (!data) {
    notFound();
  }

  const { share, sharer, resource } = data;

  if (resource.type !== "chat" && resource.type !== "message") {
    notFound();
  }

  const isMessageShare = resource.type === "message";
  const title = isMessageShare
    ? "Shared Response"
    : resource.chat.title || "Shared Chat";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="shrink-0 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessagesSquare className="size-4" strokeWidth={2.5} />
            <span className="text-sm">assistant-ui</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Avatar className="size-5">
              <AvatarImage src={sharer.image ?? undefined} alt={sharer.name} />
              <AvatarFallback className="text-[10px]">
                {sharer.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">
              {sharer.name} ·{" "}
              {formatDistanceToNow(new Date(share.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </header>

      <div className="shrink-0">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="font-medium text-lg">{title}</h1>
        </div>
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {isMessageShare ? (
          <SharedSingleMessage message={resource.message} />
        ) : (
          <SharedThread messages={resource.messages} />
        )}
      </main>

      <footer className="shrink-0 py-4">
        <div className="mx-auto max-w-3xl px-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            Start your own chat
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
