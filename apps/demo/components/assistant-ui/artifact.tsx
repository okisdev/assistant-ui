"use client";

import { useEffect, useRef, type FC } from "react";
import { Sparkles, Eye, Loader2 } from "lucide-react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { useSidePanel } from "@/contexts/side-panel-provider";

type ArtifactType = "html" | "react" | "svg";

type ArtifactCardProps = {
  title: string;
  content: string;
  type: ArtifactType;
  isLoading?: boolean;
  version?: number;
  artifactId?: string;
};

export const ArtifactCard: FC<ArtifactCardProps> = ({
  title,
  content,
  type,
  isLoading = false,
  version,
  artifactId,
}) => {
  const { openPanel } = useSidePanel();

  const handleView = () => {
    if (isLoading || !content) return;
    openPanel({
      type: "artifact",
      title,
      content,
      artifactType: type,
      version,
      artifactId,
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

type ArtifactArgs = {
  title: string;
  content: string;
  type?: ArtifactType;
};

type ArtifactResult = {
  success: boolean;
  title: string;
  content: string;
  type: ArtifactType;
  version?: number;
  artifactId?: string;
  message: string;
};

export const ArtifactToolUI = makeAssistantToolUI<ArtifactArgs, ArtifactResult>(
  {
    toolName: "create_artifact",
    render: function ArtifactToolRender({ args, result, status }) {
      const { openPanel } = useSidePanel();
      const openPanelRef = useRef(openPanel);
      openPanelRef.current = openPanel;
      const hasOpenedRef = useRef(false);
      const prevStreamingRef = useRef<boolean | null>(null);

      const isStreaming = status.type === "running";
      const title = result?.title ?? args.title ?? "Artifact";
      const content = result?.content ?? args.content ?? "";
      const type = result?.type ?? args.type ?? "html";
      const version = result?.version;
      const artifactId = result?.artifactId;

      useEffect(() => {
        if (!title) return;

        const hasContent = content.length > 0;
        const wasStreaming = prevStreamingRef.current === true;
        const streamingJustEnded = wasStreaming && !isStreaming;

        if (isStreaming && hasContent) {
          openPanelRef.current({
            type: "artifact",
            title,
            content,
            artifactType: type,
            isStreaming: true,
          });
          hasOpenedRef.current = true;
        }

        if (streamingJustEnded && hasOpenedRef.current && hasContent) {
          openPanelRef.current({
            type: "artifact",
            title,
            content,
            artifactType: type,
            isStreaming: false,
            version,
            artifactId,
          });
        }

        prevStreamingRef.current = isStreaming;
      }, [isStreaming, title, content, type, version, artifactId]);

      if (!content && !isStreaming) {
        return null;
      }

      return (
        <div className="my-4">
          <ArtifactCard
            title={title}
            content={content}
            type={type}
            isLoading={isStreaming}
            version={version}
            artifactId={artifactId}
          />
        </div>
      );
    },
  },
);
