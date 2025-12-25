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

type ComposerModeContextValue = {
  mode: ComposerMode;
  setMode: (mode: ComposerMode) => void;
  resetMode: () => void;
};

const ComposerModeContext = createContext<ComposerModeContextValue | null>(
  null,
);

export function useComposerMode(): ComposerModeContextValue {
  const ctx = useContext(ComposerModeContext);
  if (!ctx) {
    throw new Error(
      "useComposerMode must be used within a ComposerModeProvider",
    );
  }
  return ctx;
}

export function ComposerModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ComposerMode>("default");

  const setMode = useCallback((newMode: ComposerMode) => {
    setModeState(newMode);
  }, []);

  const resetMode = useCallback(() => {
    setModeState("default");
  }, []);

  const value = useMemo<ComposerModeContextValue>(
    () => ({
      mode,
      setMode,
      resetMode,
    }),
    [mode, setMode, resetMode],
  );

  return (
    <ComposerModeContext.Provider value={value}>
      {children}
    </ComposerModeContext.Provider>
  );
}
