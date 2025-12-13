"use client";

import { z } from "zod";
import { useAssistantTool } from "../model-context/useAssistantTool";
import type { MemoryStore } from "./MemoryStore";

export type UseMemoryToolsOptions = {
  /**
   * Custom name for the save_memory tool
   * @default "save_memory"
   */
  toolName?: string;

  /**
   * Custom description for the save_memory tool
   */
  description?: string;
};

const defaultDescription = `Save important information about the user for future conversations. Use this tool when the user shares personal preferences, facts about themselves, or information they want you to remember. Examples: name, preferences, goals, context about their work, etc.`;

/**
 * Hook that registers AI tools for memory management.
 * When enabled, AI can proactively save memories during conversations.
 */
export const useMemoryTools = (
  store: MemoryStore,
  options: UseMemoryToolsOptions = {},
) => {
  const { toolName = "save_memory", description = defaultDescription } =
    options;

  useAssistantTool({
    toolName,
    description,
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
    execute: async ({ content, category }) => {
      const memory = store.addMemory({ content, category });
      return {
        success: true,
        memoryId: memory.id,
        message: `Memory saved: "${content}"`,
      };
    },
  });
};
