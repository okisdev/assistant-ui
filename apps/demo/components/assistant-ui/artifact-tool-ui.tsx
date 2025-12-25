"use client";

import { useEffect, useRef } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { ArtifactCard } from "./artifact-card";
import { useSidePanel } from "@/lib/side-panel-context";

type ArtifactArgs = {
  title: string;
  content: string;
  type?: "html" | "react" | "svg";
};

type ArtifactResult = {
  success: boolean;
  title: string;
  content: string;
  type: "html" | "react" | "svg";
  message: string;
};

export const ArtifactToolUI = makeAssistantToolUI<ArtifactArgs, ArtifactResult>(
  {
    toolName: "create_artifact",
    render: function ArtifactToolRender({ args, result, status }) {
      const { openPanel } = useSidePanel();
      const prevStatusRef = useRef<string | null>(null);
      const openPanelRef = useRef(openPanel);
      openPanelRef.current = openPanel;

      const isLoading = status.type === "running";
      const title = result?.title ?? args.title ?? "Artifact";
      const content = result?.content ?? args.content ?? "";
      const type = result?.type ?? args.type ?? "html";

      useEffect(() => {
        const wasRunning = prevStatusRef.current === "running";
        const isNowComplete = status.type !== "running";

        if (wasRunning && isNowComplete && content) {
          openPanelRef.current({
            type: "artifact",
            title,
            content,
            artifactType: type,
          });
        }

        prevStatusRef.current = status.type;
      }, [status.type, content, title, type]);

      if (!content && !isLoading) {
        return null;
      }

      return (
        <div className="my-4">
          <ArtifactCard
            title={title}
            content={content}
            type={type}
            isLoading={isLoading}
          />
        </div>
      );
    },
  },
);
