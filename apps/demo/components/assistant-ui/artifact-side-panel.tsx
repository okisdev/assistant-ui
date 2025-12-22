"use client";

import type { FC } from "react";
import { X, Sparkles } from "lucide-react";
import { useArtifact } from "@/lib/artifact-context";
import { ArtifactRenderer } from "./artifact-renderer";

export const ArtifactSidePanel: FC = () => {
  const { artifact, isOpen, closeArtifact } = useArtifact();

  if (!isOpen || !artifact) {
    return null;
  }

  const handleClose = () => {
    closeArtifact();
  };

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex shrink-0 items-center justify-between gap-3 bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
            <Sparkles className="size-4 text-muted-foreground" />
          </div>
          <h2 className="truncate font-medium text-sm">{artifact.title}</h2>
        </div>
        <button
          type="button"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={handleClose}
          aria-label="Close artifact panel"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <ArtifactRenderer
          title={artifact.title}
          content={artifact.content}
          type={artifact.type}
          showHeader={false}
        />
      </div>
    </div>
  );
};
