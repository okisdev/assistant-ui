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
  /**
   * Get all stored memories.
   */
  getMemories: () => Memory[];

  /**
   * Add a new memory. Returns the created memory with generated id and createdAt.
   */
  addMemory: (memory: Omit<Memory, "id" | "createdAt">) => Memory;

  /**
   * Remove a memory by its ID.
   */
  removeMemory: (id: string) => void;

  /**
   * Clear all memories.
   */
  clearMemories: () => void;

  /**
   * Subscribe to memory changes. Returns an unsubscribe function.
   */
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
    // Optimistically create a local memory
    const tempMemory: Memory = {
      id: `temp-${Date.now()}`,
      content: input.content,
      category: input.category,
      createdAt: new Date(),
    };

    this.memories = [...this.memories, tempMemory];
    this.notifyListeners();

    // Persist to database
    this.utils.client.memory.create
      .mutate({
        content: input.content,
        category: input.category,
      })
      .then((created) => {
        // Replace temp memory with real one
        this.memories = this.memories.map((m) =>
          m.id === tempMemory.id ? toMemory(created) : m,
        );
        this.notifyListeners();
      })
      .catch((error) => {
        console.error("Failed to save memory:", error);
        // Rollback on error
        this.memories = this.memories.filter((m) => m.id !== tempMemory.id);
        this.notifyListeners();
      });

    return tempMemory;
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
