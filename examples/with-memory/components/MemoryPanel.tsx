"use client";

import { useSyncExternalStore, useState } from "react";
import { memoryStore } from "@/lib/memoryStore";
import { Button } from "@/components/ui/button";
import { TrashIcon, BrainIcon, PlusIcon } from "lucide-react";
import type { Memory } from "@assistant-ui/react";

const emptyMemories: Memory[] = [];
const getServerSnapshot = () => emptyMemories;

export function MemoryPanel() {
  const memories = useSyncExternalStore(
    memoryStore.subscribe,
    memoryStore.getMemories,
    getServerSnapshot,
  );

  const [newMemory, setNewMemory] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const handleAddMemory = () => {
    if (!newMemory.trim()) return;

    memoryStore.addMemory({
      content: newMemory.trim(),
      ...(newCategory.trim() && { category: newCategory.trim() }),
    });

    setNewMemory("");
    setNewCategory("");
  };

  const handleRemoveMemory = (id: string) => {
    memoryStore.removeMemory(id);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all memories?")) {
      memoryStore.clearMemories();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <BrainIcon className="size-5 text-primary" />
        <h2 className="font-semibold text-lg">Memories</h2>
        <span className="ml-auto text-muted-foreground text-sm">
          {memories.length}
        </span>
      </div>

      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Add a memory..."
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddMemory()}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Category (optional)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            size="sm"
            onClick={handleAddMemory}
            disabled={!newMemory.trim()}
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {memories.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No memories yet. Chat with the AI and it will remember important
            information about you!
          </p>
        ) : (
          memories.map((memory: Memory) => (
            <MemoryItem
              key={memory.id}
              memory={memory}
              onRemove={() => handleRemoveMemory(memory.id)}
            />
          ))
        )}
      </div>

      {memories.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 text-muted-foreground hover:text-destructive"
          onClick={handleClearAll}
        >
          <TrashIcon className="mr-2 size-4" />
          Clear All Memories
        </Button>
      )}
    </div>
  );
}

function MemoryItem({
  memory,
  onRemove,
}: {
  memory: Memory;
  onRemove: () => void;
}) {
  return (
    <div className="group relative rounded-lg border bg-background p-3 transition-colors hover:border-primary/50">
      {memory.category && (
        <span className="mb-1 inline-block rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
          {memory.category}
        </span>
      )}
      <p className="pr-8 text-sm">{memory.content}</p>
      <span className="text-muted-foreground text-xs">
        {memory.createdAt.toLocaleDateString("en-US")}
      </span>
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
        title="Remove memory"
      >
        <TrashIcon className="size-3.5 text-destructive" />
      </button>
    </div>
  );
}
