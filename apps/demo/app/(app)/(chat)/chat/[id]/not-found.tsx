"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquareOff, ArrowLeft, Plus } from "lucide-react";
import { useAssistantApi } from "@assistant-ui/react";

import { AppLayout } from "@/components/shared/app-layout";
import { Button } from "@/components/ui/button";

export default function ChatIdNotFound() {
  const router = useRouter();
  const api = useAssistantApi();

  const handleNewChat = () => {
    api.threads().switchToNewThread();
    router.push("/");
  };

  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted/50">
            <MessageSquareOff className="size-10 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="font-semibold text-2xl tracking-tight">
              Chat not found
            </h1>
            <p className="max-w-sm text-muted-foreground">
              This conversation doesn&apos;t exist or you don&apos;t have access
              to it.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/chats">
                <ArrowLeft className="size-4" />
                View all chats
              </Link>
            </Button>
            <Button onClick={handleNewChat}>
              <Plus className="size-4" />
              New Chat
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
