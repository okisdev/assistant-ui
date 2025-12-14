"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { MemoryPanel } from "@/components/MemoryPanel";

export default function Home() {
  return (
    <main className="flex h-dvh">
      <aside className="w-80 overflow-y-auto border-border border-r bg-muted/30 p-4">
        <MemoryPanel />
      </aside>

      <div className="flex-1">
        <Thread />
      </div>
    </main>
  );
}
