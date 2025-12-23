"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { api } from "@/utils/trpc/client";
import type { ResolvedUserCapabilities } from "@/lib/database/types";
import { DEFAULT_MODEL_ID, DEFAULT_ENABLED_MODEL_IDS } from "@/lib/ai/models";

type CapabilitiesInput = {
  memory?: {
    personalization?: boolean;
    chatHistoryContext?: boolean;
  };
  tools?: {
    artifacts?: boolean;
  };
  model?: {
    defaultId?: string;
    reasoningEnabled?: boolean;
  };
  models?: {
    enabledIds?: string[];
  };
};

type CapabilitiesContextValue = {
  /** Resolved capabilities with default values (never undefined) */
  capabilities: ResolvedUserCapabilities;
  isLoading: boolean;
  /** Update capabilities */
  updateCapabilities: (input: CapabilitiesInput) => Promise<void>;
  isUpdating: boolean;
};

const DEFAULT_CAPABILITIES: ResolvedUserCapabilities = {
  memory: {
    personalization: true,
    chatHistoryContext: false,
  },
  tools: {
    artifacts: true,
  },
  model: {
    defaultId: DEFAULT_MODEL_ID,
    reasoningEnabled: true,
  },
  models: {
    enabledIds: [...DEFAULT_ENABLED_MODEL_IDS],
  },
};

const CapabilitiesContext = createContext<CapabilitiesContextValue | null>(
  null,
);

export function useCapabilities(): CapabilitiesContextValue {
  const ctx = useContext(CapabilitiesContext);
  if (!ctx) {
    throw new Error(
      "useCapabilities must be used within a CapabilitiesProvider",
    );
  }
  return ctx;
}

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = api.user.capability.list.useQuery();
  const utils = api.useUtils();

  const updateMutation = api.user.capability.update.useMutation({
    onSuccess: () => {
      utils.user.capability.list.invalidate();
    },
  });

  const capabilities = useMemo<ResolvedUserCapabilities>(
    () => data ?? DEFAULT_CAPABILITIES,
    [data],
  );

  const updateCapabilities = useCallback(
    async (input: CapabilitiesInput) => {
      await updateMutation.mutateAsync(input);
    },
    [updateMutation],
  );

  const value = useMemo<CapabilitiesContextValue>(
    () => ({
      capabilities,
      isLoading,
      updateCapabilities,
      isUpdating: updateMutation.isPending,
    }),
    [capabilities, isLoading, updateCapabilities, updateMutation.isPending],
  );

  return (
    <CapabilitiesContext.Provider value={value}>
      {children}
    </CapabilitiesContext.Provider>
  );
}
