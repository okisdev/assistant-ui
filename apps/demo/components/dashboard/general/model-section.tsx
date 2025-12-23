"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIVE_MODELS,
  DEFAULT_MODEL_ID,
  getModelById,
  isValidModelId,
} from "@/lib/ai/models";
import { SettingHeader } from "@/components/dashboard/setting-header";

function ModelSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export function ModelSection() {
  const { data: capabilities, isLoading } = api.user.capability.list.useQuery();
  const utils = api.useUtils();

  const updateCapabilitiesMutation = api.user.capability.update.useMutation({
    onSuccess: () => {
      utils.user.capability.list.invalidate();
      toast.success("Default model updated");
    },
    onError: () => {
      toast.error("Failed to update default model");
    },
  });

  const handleModelChange = (modelId: string) => {
    if (!isValidModelId(modelId)) return;
    updateCapabilitiesMutation.mutate({ model: { defaultId: modelId } });
  };

  const currentModelId = capabilities?.model.defaultId ?? DEFAULT_MODEL_ID;

  const enabledModels = useMemo(() => {
    const enabledIds = new Set(capabilities?.models.enabledIds ?? []);

    // Filter to only show enabled models
    const models = ACTIVE_MODELS.filter((m) => enabledIds.has(m.id));

    // Always include the current model if it exists (even if disabled)
    const currentModel = getModelById(currentModelId);
    if (currentModel && !enabledIds.has(currentModelId)) {
      models.unshift(currentModel);
    }

    return models;
  }, [capabilities?.models.enabledIds, currentModelId]);

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="AI Model" />

      {isLoading ? (
        <ModelSkeleton />
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">Default model</span>
            <p className="text-muted-foreground text-xs">
              The AI model used for new conversations
            </p>
          </div>
          <Select
            value={currentModelId}
            onValueChange={handleModelChange}
            disabled={updateCapabilitiesMutation.isPending}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {enabledModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    {model.description && (
                      <span className="text-muted-foreground text-xs">
                        {model.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
