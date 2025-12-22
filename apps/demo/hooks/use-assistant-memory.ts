"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAssistantApi } from "@assistant-ui/react";
import type {
  Memory,
  MemoryStore,
} from "@/lib/adapters/database-memory-adapter";

type UserProfile = {
  name: string;
  nickname?: string | null;
  workType?: string | null;
};

const SAVE_INSTRUCTIONS = `You have the ability to remember information about the user using the save_memory tool.

When the user shares personal information, preferences, or anything they might want you to remember, use the save_memory tool to store it. This includes:
- Their name or personal details
- Preferences and interests
- Goals or projects
- Important context

Be proactive about saving memories - if the user mentions something significant, save it without being asked.`;

const formatUserInfo = (user: UserProfile | null | undefined): string => {
  if (!user) return "";

  const parts: string[] = [];
  const displayName = user.nickname || user.name;
  parts.push(`- Name: ${displayName}`);

  if (user.workType) {
    parts.push(`- Work type: ${user.workType}`);
  }

  return `## User Profile
${parts.join("\n")}`;
};

const formatMemories = (memories: Memory[]): string => {
  if (memories.length === 0) return "";

  const lines = memories.map((m) => {
    const category = m.category ? `[${m.category}] ` : "";
    return `- ${category}${m.content}`;
  });

  return `## User Memories
Important information from previous conversations:
${lines.join("\n")}`;
};

const buildSystemPrompt = (
  user: UserProfile | null | undefined,
  memories: Memory[],
  canSave: boolean,
): string => {
  const parts: string[] = [];

  // Only include save instructions when personalization is enabled
  if (canSave) {
    parts.push(SAVE_INSTRUCTIONS);
  }

  const userInfo = formatUserInfo(user);
  if (userInfo) parts.push(userInfo);

  const memoriesText = formatMemories(memories);
  if (memoriesText) parts.push(memoriesText);

  return parts.join("\n\n");
};

type UseAssistantMemoryOptions = {
  /** Whether to show memory context to AI (default: true) */
  enabled?: boolean;
  /** Whether AI can save new memories (default: true) */
  canSave?: boolean;
};

/**
 * Hook that registers user context and memories as system context.
 * User profile and memories are automatically injected into the AI's context.
 * When canSave is false, AI can still read existing memories but won't save new ones.
 */
export const useAssistantMemory = (
  store: MemoryStore,
  user?: UserProfile | null,
  options: UseAssistantMemoryOptions = {},
) => {
  const { enabled = true, canSave = true } = options;
  const api = useAssistantApi();

  const memories = useSyncExternalStore(
    store.subscribe,
    store.getMemories,
    store.getMemories,
  );

  const systemPrompt = useMemo(
    () => buildSystemPrompt(user, memories, canSave),
    [user, memories, canSave],
  );

  useEffect(() => {
    if (!enabled || !systemPrompt) return;

    return api.modelContext().register({
      getModelContext: () => ({ system: systemPrompt }),
    });
  }, [api, systemPrompt, enabled]);
};
