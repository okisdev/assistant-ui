"use client";

import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useAssistantApi } from "@assistant-ui/react";
import type { MemoryStore } from "@/lib/adapters/database-memory-adapter";

type UseMemoryToolsOptions = {
  enabled?: boolean;
};

/**
 * Hook that registers AI tools for memory management.
 * When enabled, AI can proactively save memories during conversations.
 */
export const useMemoryTools = (
  store: MemoryStore,
  options: UseMemoryToolsOptions = {},
) => {
  const { enabled = true } = options;
  const api = useAssistantApi();

  const tool = useMemo(
    () => ({
      description:
        "Save important information about the user for future conversations. Use this tool when the user shares personal preferences, facts about themselves, or information they want you to remember. Examples: name, preferences, goals, context about their work, etc.",
      parameters: z.object({
        content: z
          .string()
          .describe("The information to remember about the user"),
        category: z
          .string()
          .optional()
          .describe(
            "Optional category for the memory (e.g., 'preference', 'fact', 'goal', 'context')",
          ),
      }),
      execute: async ({
        content,
        category,
      }: {
        content: string;
        category?: string;
      }) => {
        const memory = store.addMemory({ content, category });
        return {
          success: true,
          memoryId: memory.id,
          message: `Memory saved: "${content}"`,
        };
      },
    }),
    [store],
  );

  useEffect(() => {
    if (!enabled) return;

    return api.modelContext().register({
      getModelContext: () => ({
        tools: {
          save_memory: tool,
        },
      }),
    });
  }, [api, tool, enabled]);
};
