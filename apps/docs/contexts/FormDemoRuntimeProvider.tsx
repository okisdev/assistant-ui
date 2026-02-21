"use client";

import { AssistantRuntimeProvider, AssistantCloud } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

export function FormDemoRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const assistantCloud = new AssistantCloud({
    baseUrl: process.env["NEXT_PUBLIC_ASSISTANT_BASE_URL"]!,
    anonymous: true,
  });

  const runtime = useChatRuntime({
    cloud: assistantCloud,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
