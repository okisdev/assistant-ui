"use client";

import { Thread } from "@/components/assistant-ui/thread";
import {
  AssistantRuntimeProvider,
  useAui,
  Tools,
  type Toolkit,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { z } from "zod";

// Render-only tool definitions for MCP tools (execution happens on the backend)
const mcpToolkit: Toolkit = {
  get_weather: {
    description: "Get current weather for a location",
    parameters: z.object({
      location: z.string(),
    }),
    render: ({ args, result }) => {
      if (!result) return <div>Fetching weather for {args.location}...</div>;
      return (
        <div className="rounded-lg border p-3">
          <p className="font-medium">{args.location}</p>
          <p className="text-muted-foreground text-sm">
            {typeof result === "string" ? result : JSON.stringify(result)}
          </p>
        </div>
      );
    },
  },
};

export default function Home() {
  const runtime = useChatRuntime({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const aui = useAui({
    tools: Tools({ toolkit: mcpToolkit }),
  });

  return (
    <AssistantRuntimeProvider aui={aui} runtime={runtime}>
      <div className="h-full">
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}
