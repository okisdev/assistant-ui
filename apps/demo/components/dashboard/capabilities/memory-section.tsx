"use client";

import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { SettingRowSwitch } from "@/components/dashboard/setting-row";
import { SettingHeader } from "@/components/dashboard/setting-header";

export function MemorySection() {
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

  const handleTogglePersonalization = (enabled: boolean) => {
    updateCapabilitiesMutation.mutate({ memory: { personalization: enabled } });
  };

  const personalization = capabilities?.memory.personalization ?? true;

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Memory" />

      <div className="flex flex-col gap-2">
        <SettingRowSwitch
          title="Personalization"
          description="AI remembers your preferences and information from conversations"
          checked={personalization}
          disabled={
            isCapabilitiesLoading || updateCapabilitiesMutation.isPending
          }
          onCheckedChange={handleTogglePersonalization}
        />
        <SettingRowSwitch
          title="Chat history context"
          description="AI can reference your past conversations for context"
          checked={false}
          disabled
          badge="Coming soon"
        />
      </div>
    </div>
  );
}
