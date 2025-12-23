"use client";

import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { Switch } from "@/components/ui/switch";

function CapabilityRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
  badge,
}: {
  title: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge && (
            <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

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
      <h1 className="font-medium text-xl tracking-tight">Artifacts</h1>

      <div className="flex flex-col gap-2">
        <CapabilityRow
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
