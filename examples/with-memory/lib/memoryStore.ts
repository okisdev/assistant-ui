import type { Memory, MemoryStore } from "@assistant-ui/react";

const STORAGE_KEY = "assistant-ui-memories";

const generateId = () => Math.random().toString(36).substring(2, 9);

const createLocalStorageMemoryStore = (): MemoryStore => {
  let memories: Memory[] = [];
  const listeners = new Set<() => void>();

  const loadFromStorage = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        memories = parsed.map((m: Memory) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        }));
      }
    } catch {
      // ignore
    }
  };

  const saveToStorage = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch {
      // ignore
    }
  };

  const notifyListeners = () => {
    listeners.forEach((listener) => listener());
  };

  loadFromStorage();

  return {
    getMemories: () => memories,

    addMemory: (memory) => {
      const newMemory: Memory = {
        ...memory,
        id: generateId(),
        createdAt: new Date(),
      };
      memories = [...memories, newMemory];
      saveToStorage();
      notifyListeners();
      return newMemory;
    },

    removeMemory: (id) => {
      memories = memories.filter((m) => m.id !== id);
      saveToStorage();
      notifyListeners();
    },

    clearMemories: () => {
      memories = [];
      saveToStorage();
      notifyListeners();
    },

    subscribe: (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
  };
};

export const memoryStore = createLocalStorageMemoryStore();
