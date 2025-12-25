"use client";

import type { FC } from "react";
import { Sparkles, Eye, Loader2 } from "lucide-react";
import { useSidePanel } from "@/lib/side-panel-context";

type ArtifactCardProps = {
  title: string;
  content: string;
  type: "html" | "react" | "svg";
  isLoading?: boolean;
};

export const ArtifactCard: FC<ArtifactCardProps> = ({
  title,
  content,
  type,
  isLoading = false,
}) => {
  const { openPanel } = useSidePanel();

  const handleView = () => {
    if (isLoading || !content) return;
    openPanel({
      type: "artifact",
      title,
      content,
      artifactType: type,
    });
  };

  return (
    <button
      type="button"
      onClick={handleView}
      disabled={isLoading || !content}
      className="flex w-full items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <Sparkles className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="truncate font-medium text-sm">{title}</span>
        {isLoading && (
          <span className="text-muted-foreground text-xs">Generating...</span>
        )}
      </div>
      {!isLoading && content && (
        <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
          <Eye className="size-3.5" />
          <span>View</span>
        </div>
      )}
    </button>
  );
};
