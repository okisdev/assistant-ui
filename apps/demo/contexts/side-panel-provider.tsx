"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ArtifactContent = {
  type: "artifact";
  title: string;
  content: string;
  artifactType: "html" | "react" | "svg";
};

export type FilePreviewContent = {
  type: "file-preview";
  title: string;
  url: string;
  mimeType: string;
  fileSize?: number;
};

export type PanelContent = ArtifactContent | FilePreviewContent;

type SidePanelContextValue = {
  content: PanelContent | null;
  isOpen: boolean;
  openPanel: (content: PanelContent) => void;
  closePanel: () => void;
};

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function SidePanelProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PanelContent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = useCallback((newContent: PanelContent) => {
    setContent(newContent);
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SidePanelContext.Provider
      value={{ content, isOpen, openPanel, closePanel }}
    >
      {children}
    </SidePanelContext.Provider>
  );
}

export function useSidePanel() {
  const context = useContext(SidePanelContext);
  if (!context) {
    throw new Error("useSidePanel must be used within a SidePanelProvider");
  }
  return context;
}

export type Artifact = {
  title: string;
  content: string;
  type: "html" | "react" | "svg";
};

export function useArtifact() {
  const { content, isOpen, openPanel, closePanel } = useSidePanel();

  const artifact: Artifact | null =
    content?.type === "artifact"
      ? {
          title: content.title,
          content: content.content,
          type: content.artifactType,
        }
      : null;

  const openArtifact = useCallback(
    (artifact: Artifact) => {
      openPanel({
        type: "artifact",
        title: artifact.title,
        content: artifact.content,
        artifactType: artifact.type,
      });
    },
    [openPanel],
  );

  return {
    artifact,
    isOpen: isOpen && content?.type === "artifact",
    openArtifact,
    closeArtifact: closePanel,
  };
}
