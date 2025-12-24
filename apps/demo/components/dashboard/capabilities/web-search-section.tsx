"use client";

import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { SettingRowSwitch } from "@/components/dashboard/setting-row";
import { SettingHeader } from "@/components/dashboard/setting-header";

export function WebSearchSection() {
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

  const handleToggleWebSearch = (enabled: boolean) => {
    updateCapabilitiesMutation.mutate({ tools: { webSearch: enabled } });
  };

  const webSearchEnabled = capabilities?.tools.webSearch ?? false;

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Web Search" />

      <div className="flex flex-col gap-2">
        <SettingRowSwitch
          title="Web search"
          description="AI can search the web for real-time information and cite sources in responses"
          checked={webSearchEnabled}
          disabled={
            isCapabilitiesLoading || updateCapabilitiesMutation.isPending
          }
          onCheckedChange={handleToggleWebSearch}
        />
      </div>
    </div>
  );
}
