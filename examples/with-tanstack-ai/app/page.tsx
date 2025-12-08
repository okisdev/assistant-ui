"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useTanStackChatRuntime } from "@assistant-ui/react-tanstack-ai";

export default function Home() {
  // Using the TanStack AI runtime hook
  const runtime = useTanStackChatRuntime({
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-full">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}
