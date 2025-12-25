"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { RouterInputs } from "@/server";
import { api } from "@/utils/trpc/client";
import type { ResolvedUserCapabilities } from "@/lib/database/types";
import { DEFAULT_CAPABILITIES } from "@/lib/ai/capabilities";

type CapabilityUpdateInput = RouterInputs["user"]["capability"]["update"];

type CapabilitiesContextValue = {
  /** Resolved capabilities with default values (never undefined) */
  capabilities: ResolvedUserCapabilities;
  isLoading: boolean;
  /** Update capabilities */
  updateCapabilities: (input: CapabilityUpdateInput) => Promise<void>;
  isUpdating: boolean;
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
    async (input: CapabilityUpdateInput) => {
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
