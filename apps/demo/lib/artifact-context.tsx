"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Artifact = {
  title: string;
  content: string;
  type: "html" | "react" | "svg";
};

type ArtifactContextValue = {
  artifact: Artifact | null;
  isOpen: boolean;
  openArtifact: (artifact: Artifact) => void;
  closeArtifact: () => void;
};

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openArtifact = useCallback((newArtifact: Artifact) => {
    setArtifact(newArtifact);
    setIsOpen(true);
  }, []);

  const closeArtifact = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ArtifactContext.Provider
      value={{ artifact, isOpen, openArtifact, closeArtifact }}
    >
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifact() {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error("useArtifact must be used within an ArtifactProvider");
  }
  return context;
}
