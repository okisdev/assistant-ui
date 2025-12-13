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
 *
 * Users must provide their own implementation of this interface.
 * This could be localStorage, IndexedDB, a backend API, etc.
 *
 * @example
 * ```tsx
 * // Example localStorage implementation
 * const createLocalStorageMemoryStore = (key: string): MemoryStore => {
 *   let memories: Memory[] = [];
 *   const listeners = new Set<() => void>();
 *
 *   // Load from storage
 *   const stored = localStorage.getItem(key);
 *   if (stored) memories = JSON.parse(stored);
 *
 *   return {
 *     getMemories: () => memories,
 *     addMemory: (memory) => {
 *       const newMemory = { ...memory, id: crypto.randomUUID(), createdAt: new Date() };
 *       memories = [...memories, newMemory];
 *       localStorage.setItem(key, JSON.stringify(memories));
 *       listeners.forEach(l => l());
 *       return newMemory;
 *     },
 *     removeMemory: (id) => {
 *       memories = memories.filter(m => m.id !== id);
 *       localStorage.setItem(key, JSON.stringify(memories));
 *       listeners.forEach(l => l());
 *     },
 *     clearMemories: () => {
 *       memories = [];
 *       localStorage.setItem(key, JSON.stringify(memories));
 *       listeners.forEach(l => l());
 *     },
 *     subscribe: (callback) => {
 *       listeners.add(callback);
 *       return () => listeners.delete(callback);
 *     },
 *   };
 * };
 * ```
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
