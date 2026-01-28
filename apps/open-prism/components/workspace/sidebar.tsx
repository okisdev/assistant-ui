"use client";

import { FileTextIcon, FolderIcon } from "lucide-react";
import { useDocumentStore } from "@/stores/document-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const fileName = useDocumentStore((s) => s.fileName);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-9 items-center gap-2 border-sidebar-border border-b px-3">
        <FolderIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-xs">Files</span>
      </div>
      <div className="flex-1 p-2">
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
            "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <FileTextIcon className="size-4" />
          <span className="truncate">{fileName}</span>
        </button>
      </div>
      <div className="border-sidebar-border border-t px-3 py-2 text-muted-foreground text-xs">
        Open-Prism v0.1
      </div>
    </div>
  );
}
