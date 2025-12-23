"use client";

import { useEffect, useMemo } from "react";
import { useAssistantApi } from "@assistant-ui/react";
import type { MemoryStore } from "@/lib/adapters/database-memory-adapter";
import { saveMemoryTool, saveMemorySchema } from "@/lib/ai/tools/save-memory";

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
      description: saveMemoryTool.description,
      parameters: saveMemorySchema,
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
