"use client";

import { createContext, useContext } from "react";

export type ProjectContextValue = {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
};

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    // Return a default context when not within a provider
    return {
      currentProjectId: null,
      setCurrentProjectId: () => {},
    };
  }
  return context;
}
