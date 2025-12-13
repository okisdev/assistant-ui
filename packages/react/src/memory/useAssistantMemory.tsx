"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAssistantApi } from "../context/react/AssistantApiContext";
import type { Memory, MemoryStore } from "./MemoryStore";

export type UseAssistantMemoryOptions = {
  /**
   * Whether to enable the AI memory tools (save_memory).
   * When enabled, AI can proactively save memories during conversations.
   * @default false
   */
  enableTools?: boolean;

  /**
   * Custom format function for converting memories to system prompt.
   * @default Built-in formatter that creates a bullet list
   */
  formatMemories?: (memories: Memory[]) => string;

  /**
   * Priority for the memory context. Higher priority contexts appear first.
   * @default 0
   */
  priority?: number;
};

const defaultFormatMemories = (memories: Memory[]): string => {
  if (memories.length === 0) return "";

  const lines = memories.map((m) => {
    const category = m.category ? `[${m.category}] ` : "";
    return `- ${category}${m.content}`;
  });

  return `## User Memories\nImportant information about the user from previous conversations:\n${lines.join("\n")}`;
};

export type UseAssistantMemoryResult = {
  /**
   * Current list of memories
   */
  memories: Memory[];

  /**
   * Add a new memory
   */
  addMemory: (memory: Omit<Memory, "id" | "createdAt">) => Memory;

  /**
   * Remove a memory by ID
   */
  removeMemory: (id: string) => void;

  /**
   * Clear all memories
   */
  clearMemories: () => void;
};

export const useAssistantMemory = (
  store: MemoryStore,
  options: UseAssistantMemoryOptions = {},
): UseAssistantMemoryResult => {
  const { formatMemories = defaultFormatMemories, priority = 0 } = options;

  const api = useAssistantApi();

  // Subscribe to store changes using React 18 pattern
  const memories = useSyncExternalStore(
    store.subscribe,
    store.getMemories,
    store.getMemories,
  );

  // Generate stable system prompt
  const systemPrompt = useMemo(
    () => formatMemories(memories),
    [formatMemories, memories],
  );

  // Register memories to ModelContext
  useEffect(() => {
    if (!systemPrompt) return;

    return api.modelContext().register({
      getModelContext: () => ({
        system: systemPrompt,
        priority,
      }),
    });
  }, [api, systemPrompt, priority]);

  return {
    memories,
    addMemory: store.addMemory,
    removeMemory: store.removeMemory,
    clearMemories: store.clearMemories,
  };
};
