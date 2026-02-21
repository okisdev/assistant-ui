"use client";

import {
  AssistantRuntimeProvider,
  AssistantCloud,
  useAui,
  Suggestions,
  AuiProvider,
} from "@assistant-ui/react";
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

  const aui = useAui({
    suggestions: Suggestions([
      {
        title: "Fill out the form",
        label: "with sample data",
        prompt: "Please fill out the signup form with sample data for me.",
      },
      {
        title: "Help me register",
        label: "for the hackathon",
        prompt:
          "I'd like to sign up for the hackathon. My name is Jane Doe and my email is jane@example.com.",
      },
    ]),
  });

  return (
    <AuiProvider value={aui}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </AuiProvider>
  );
}
