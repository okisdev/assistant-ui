import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import { api } from "@/utils/trpc/server";
import { SharedThread } from "@/components/app/share/id/thread";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SharePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  const data = await api.share.getPublic({ id });

  if (!data) {
    notFound();
  }

  const { share, sharer, resource } = data;

  if (resource.type !== "chat") {
    notFound();
  }

  const title = resource.chat.title || "Shared Chat";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="font-medium text-lg">{title}</h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Shared by</span>
            <Avatar className="size-6">
              <AvatarImage src={sharer.image ?? undefined} alt={sharer.name} />
              <AvatarFallback className="text-xs">
                {sharer.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{sharer.name}</span>
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(share.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <SharedThread messages={resource.messages} />
      </main>

      <footer className="border-t py-4">
        <div className="mx-auto max-w-3xl px-4 text-center text-muted-foreground text-sm">
          <p>
            This is a shared conversation.{" "}
            <a
              href="/"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Start your own chat
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
