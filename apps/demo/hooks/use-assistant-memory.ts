"use client";

import { useSyncExternalStore } from "react";
import type {
  Memory,
  MemoryStore,
} from "@/lib/adapters/database-memory-adapter";

export const useAssistantMemory = (store: MemoryStore): Memory[] => {
  const memories = useSyncExternalStore(
    store.subscribe,
    store.getMemories,
    store.getMemories,
  );

  return memories;
};
