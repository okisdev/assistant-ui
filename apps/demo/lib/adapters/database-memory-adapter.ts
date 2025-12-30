import type { api } from "@/utils/trpc/client";

type TRPCUtils = ReturnType<typeof api.useUtils>;

/**
 * Represents a single memory item stored about the user.
 */
export type Memory = {
  id: string;
  content: string;
  category?: string;
  createdAt: Date;
};

/**
 * Interface for memory storage adapters.
 */
export type MemoryStore = {
  getMemories: () => Memory[];
  addMemory: (memory: Omit<Memory, "id" | "createdAt">) => Memory;
  updateMemory: (
    id: string,
    updates: Partial<Omit<Memory, "id" | "createdAt">>,
  ) => void;
  removeMemory: (id: string) => void;
  clearMemories: () => void;
  subscribe: (callback: () => void) => () => void;
};

type MemoryRow = {
  id: string;
  content: string;
  category: string | null;
  createdAt: Date;
};

const toMemory = (row: MemoryRow): Memory => ({
  id: row.id,
  content: row.content,
  category: row.category ?? undefined,
  createdAt: row.createdAt,
});

export class DatabaseMemoryStore implements MemoryStore {
  private memories: Memory[] = [];
  private listeners = new Set<() => void>();
  private initialized = false;

  constructor(private utils: TRPCUtils) {}

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const rows = await this.utils.memory.list.fetch();
    this.memories = rows.map(toMemory);
    this.initialized = true;
    this.notifyListeners();
  }

  getMemories = (): Memory[] => {
    return this.memories;
  };

  addMemory = (input: Omit<Memory, "id" | "createdAt">): Memory => {
    const tempMemory: Memory = {
      id: `temp-${Date.now()}`,
      content: input.content,
      category: input.category,
      createdAt: new Date(),
    };

    this.memories = [...this.memories, tempMemory];
    this.notifyListeners();

    this.utils.client.memory.create
      .mutate({
        content: input.content,
        category: input.category,
      })
      .then((created) => {
        this.memories = this.memories.map((m) =>
          m.id === tempMemory.id ? toMemory(created) : m,
        );
        this.notifyListeners();
      })
      .catch((error) => {
        console.error("Failed to save memory:", error);
        this.memories = this.memories.filter((m) => m.id !== tempMemory.id);
        this.notifyListeners();
      });

    return tempMemory;
  };

  updateMemory = (
    id: string,
    updates: Partial<Omit<Memory, "id" | "createdAt">>,
  ): void => {
    const memoryToUpdate = this.memories.find((m) => m.id === id);
    if (!memoryToUpdate) return;

    const previousMemory = { ...memoryToUpdate };

    this.memories = this.memories.map((m) =>
      m.id === id
        ? {
            ...m,
            content: updates.content ?? m.content,
            category: updates.category ?? m.category,
          }
        : m,
    );
    this.notifyListeners();

    this.utils.client.memory.update
      .mutate({
        id,
        content: updates.content ?? memoryToUpdate.content,
        category: updates.category,
      })
      .then((updated) => {
        this.memories = this.memories.map((m) =>
          m.id === id ? toMemory(updated) : m,
        );
        this.notifyListeners();
      })
      .catch((error) => {
        console.error("Failed to update memory:", error);
        this.memories = this.memories.map((m) =>
          m.id === id ? previousMemory : m,
        );
        this.notifyListeners();
      });
  };

  removeMemory = (id: string): void => {
    const memoryToRemove = this.memories.find((m) => m.id === id);
    if (!memoryToRemove) return;

    // Optimistically remove
    this.memories = this.memories.filter((m) => m.id !== id);
    this.notifyListeners();

    // Persist to database
    this.utils.client.memory.delete.mutate({ id }).catch((error) => {
      console.error("Failed to delete memory:", error);
      // Rollback on error
      this.memories = [...this.memories, memoryToRemove];
      this.notifyListeners();
    });
  };

  clearMemories = (): void => {
    const previousMemories = this.memories;

    // Optimistically clear
    this.memories = [];
    this.notifyListeners();

    // Persist to database
    this.utils.client.memory.clear.mutate().catch((error) => {
      console.error("Failed to clear memories:", error);
      // Rollback on error
      this.memories = previousMemories;
      this.notifyListeners();
    });
  };

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };
}
