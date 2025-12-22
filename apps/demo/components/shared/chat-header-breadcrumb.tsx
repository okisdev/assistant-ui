"use client";

import Link from "next/link";
import { ChevronRight, FolderKanban } from "lucide-react";

import { ChatHeaderTitle } from "./chat-header-title";

type ChatHeaderBreadcrumbProps = {
  project: {
    id: string;
    name: string;
  } | null;
};

export function ChatHeaderBreadcrumb({ project }: ChatHeaderBreadcrumbProps) {
  if (!project) {
    return <ChatHeaderTitle />;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={`/project/${project.id}`}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
      >
        <FolderKanban className="size-3.5" />
        <span className="max-w-32 truncate">{project.name}</span>
      </Link>
      <ChevronRight className="size-3.5 text-muted-foreground/50" />
      <ChatHeaderTitle />
    </div>
  );
}
