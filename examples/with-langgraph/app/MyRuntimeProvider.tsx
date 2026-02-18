"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { createThread, getThreadState, sendMessage } from "@/lib/chatApi";
import { LangChainMessage } from "@assistant-ui/react-langgraph";

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtime = useLangGraphRuntime({
    stream: async function* (messages, { initialize }) {
      let { externalId } = await initialize();
      if (!externalId) {
        // Fallback: when no cloud backend is configured,
        // InMemoryThreadListAdapter returns externalId: undefined.
        // Create the thread directly.
        const { thread_id } = await createThread();
        externalId = thread_id;
      }

      const generator = sendMessage({
        threadId: externalId,
        messages,
      });

      yield* generator;
    },
    create: async () => {
      const { thread_id } = await createThread();
      return { externalId: thread_id };
    },
    load: async (externalId) => {
      const state = await getThreadState(externalId);
      return {
        messages:
          (state.values as { messages?: LangChainMessage[] }).messages ?? [],
        interrupts: state.tasks[0]?.interrupts ?? [],
      };
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
