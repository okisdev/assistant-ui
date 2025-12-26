"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

type SelectedAppsContextValue = {
  selectedAppIds: string[];
  toggleApp: (appId: string) => void;
  selectApp: (appId: string) => void;
  deselectApp: (appId: string) => void;
  clearApps: () => void;
  isSelected: (appId: string) => boolean;
};

const SelectedAppsContext = createContext<SelectedAppsContextValue | null>(
  null,
);

export function useSelectedApps(): SelectedAppsContextValue {
  const ctx = useContext(SelectedAppsContext);
  if (!ctx) {
    throw new Error(
      "useSelectedApps must be used within a SelectedAppsProvider",
    );
  }
  return ctx;
}

export function SelectedAppsProvider({ children }: { children: ReactNode }) {
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

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

  const isSelected = useCallback(
    (appId: string) => selectedAppIds.includes(appId),
    [selectedAppIds],
  );

  const value = useMemo<SelectedAppsContextValue>(
    () => ({
      selectedAppIds,
      toggleApp,
      selectApp,
      deselectApp,
      clearApps,
      isSelected,
    }),
    [selectedAppIds, toggleApp, selectApp, deselectApp, clearApps, isSelected],
  );

  return (
    <SelectedAppsContext.Provider value={value}>
      {children}
    </SelectedAppsContext.Provider>
  );
}
