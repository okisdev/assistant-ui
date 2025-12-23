"use client";

import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { SettingRowSwitch } from "@/components/dashboard/setting-row";
import { SettingHeader } from "@/components/dashboard/setting-header";

export function ArtifactsSection() {
  const { data: capabilities, isLoading: isCapabilitiesLoading } =
    api.user.capability.list.useQuery();
  const utils = api.useUtils();

  const updateCapabilitiesMutation = api.user.capability.update.useMutation({
    onSuccess: () => {
      utils.user.capability.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to update setting");
    },
  });

  const handleToggleArtifacts = (enabled: boolean) => {
    updateCapabilitiesMutation.mutate({ tools: { artifacts: enabled } });
  };

  const artifactsEnabled = capabilities?.tools.artifacts ?? true;

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Artifacts" />

      <div className="flex flex-col gap-2">
        <SettingRowSwitch
          title="Artifact generation"
          description="AI can create interactive HTML, CSS, and JavaScript content that renders in a preview panel"
          checked={artifactsEnabled}
          disabled={
            isCapabilitiesLoading || updateCapabilitiesMutation.isPending
          }
          onCheckedChange={handleToggleArtifacts}
        />
      </div>
    </div>
  );
}
