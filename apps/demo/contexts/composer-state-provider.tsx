"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type ComposerMode = "default" | "image-generation";

type ComposerStateContextValue = {
  // Mode
  mode: ComposerMode;
  setMode: (mode: ComposerMode) => void;
  resetMode: () => void;
  // Selected Apps
  selectedAppIds: string[];
  toggleApp: (appId: string) => void;
  selectApp: (appId: string) => void;
  deselectApp: (appId: string) => void;
  clearApps: () => void;
  isAppSelected: (appId: string) => boolean;
  // Reset all
  resetAll: () => void;
};

const ComposerStateContext = createContext<ComposerStateContextValue | null>(
  null,
);

export function useComposerState(): ComposerStateContextValue {
  const ctx = useContext(ComposerStateContext);
  if (!ctx) {
    throw new Error(
      "useComposerState must be used within a ComposerStateProvider",
    );
  }
  return ctx;
}

export function ComposerStateProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ComposerMode>("default");
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  // Mode actions
  const setMode = useCallback((newMode: ComposerMode) => {
    setModeState(newMode);
  }, []);

  const resetMode = useCallback(() => {
    setModeState("default");
  }, []);

  // App selection actions
  const toggleApp = useCallback((appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId)
        ? prev.filter((id) => id !== appId)
        : [...prev, appId],
    );
  }, []);

  const selectApp = useCallback((appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev : [...prev, appId],
    );
  }, []);

  const deselectApp = useCallback((appId: string) => {
    setSelectedAppIds((prev) => prev.filter((id) => id !== appId));
  }, []);

  const clearApps = useCallback(() => {
    setSelectedAppIds([]);
  }, []);

  const isAppSelected = useCallback(
    (appId: string) => selectedAppIds.includes(appId),
    [selectedAppIds],
  );

  // Reset all composer state (useful when switching threads)
  const resetAll = useCallback(() => {
    setModeState("default");
    setSelectedAppIds([]);
  }, []);

  const value = useMemo<ComposerStateContextValue>(
    () => ({
      mode,
      setMode,
      resetMode,
      selectedAppIds,
      toggleApp,
      selectApp,
      deselectApp,
      clearApps,
      isAppSelected,
      resetAll,
    }),
    [
      mode,
      setMode,
      resetMode,
      selectedAppIds,
      toggleApp,
      selectApp,
      deselectApp,
      clearApps,
      isAppSelected,
      resetAll,
    ],
  );

  return (
    <ComposerStateContext.Provider value={value}>
      {children}
    </ComposerStateContext.Provider>
  );
}
