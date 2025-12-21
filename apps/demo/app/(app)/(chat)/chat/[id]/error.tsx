"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Plus, RotateCcw } from "lucide-react";
import { useAssistantApi } from "@assistant-ui/react";

import { AppLayout } from "@/components/shared/app-layout";
import { Button } from "@/components/ui/button";

export default function ChatIdError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const api = useAssistantApi();

  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  const handleNewChat = () => {
    api.threads().switchToNewThread();
    router.push("/");
  };

  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-10 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="font-semibold text-2xl tracking-tight">
              Something went wrong
            </h1>
            <p className="max-w-sm text-muted-foreground">
              We encountered an error while loading this conversation. Please
              try again.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" />
              Try again
            </Button>
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
