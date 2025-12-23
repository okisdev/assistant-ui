"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AVAILABLE_MODELS,
  type ModelDefinition,
  type ModelProvider,
} from "@/lib/ai/models";

function ModelSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="size-5 animate-pulse rounded bg-muted" />
        <div className="flex flex-col gap-1">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

function ModelRow({
  model,
  enabled,
  disabled,
  onToggle,
}: {
  model: ModelDefinition;
  enabled: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const Icon = model.icon;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="size-5 shrink-0 fill-current text-muted-foreground" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{model.name}</span>
            {model.deprecated && (
              <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                Deprecated
              </span>
            )}
            {model.primary && (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">
                Primary
              </span>
            )}
          </div>
          {model.description && (
            <p className="text-muted-foreground text-xs">{model.description}</p>
          )}
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: "OpenAI",
  xai: "xAI",
};

export function ModelsSection() {
  const [showDeprecated, setShowDeprecated] = useState(false);

  const { data: capabilities, isLoading } = api.user.capability.list.useQuery();
  const utils = api.useUtils();

  const updateMutation = api.user.capability.update.useMutation({
    onSuccess: () => {
      utils.user.capability.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to update model");
    },
  });

  const enabledIds = useMemo(
    () => new Set(capabilities?.models.enabledIds ?? []),
    [capabilities?.models.enabledIds],
  );

  const handleToggleModel = (modelId: string, enabled: boolean) => {
    const currentIds = capabilities?.models.enabledIds ?? [];
    const newIds = enabled
      ? [...currentIds, modelId]
      : currentIds.filter((id) => id !== modelId);

    updateMutation.mutate({ models: { enabledIds: newIds } });
  };

  const filteredModels = useMemo(() => {
    return AVAILABLE_MODELS.filter((m) => showDeprecated || !m.deprecated);
  }, [showDeprecated]);

  const groupedModels = useMemo(() => {
    const groups = new Map<ModelProvider, ModelDefinition[]>();

    for (const model of filteredModels) {
      const existing = groups.get(model.provider) ?? [];
      groups.set(model.provider, [...existing, model]);
    }

    return groups;
  }, [filteredModels]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-medium text-xl tracking-tight">Models</h1>
        <div className="flex items-center gap-2">
          <Switch
            id="show-deprecated"
            checked={showDeprecated}
            onCheckedChange={setShowDeprecated}
          />
          <Label
            htmlFor="show-deprecated"
            className="cursor-pointer text-muted-foreground text-sm"
          >
            Show deprecated
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <ModelSkeleton />
          <ModelSkeleton />
          <ModelSkeleton />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(groupedModels.entries()).map(([provider, models]) => (
            <div key={provider} className="flex flex-col gap-3">
              <h2 className="font-medium text-muted-foreground text-sm">
                {PROVIDER_LABELS[provider]}
              </h2>
              <div className="flex flex-col gap-2">
                {models.map((model) => (
                  <ModelRow
                    key={model.id}
                    model={model}
                    enabled={enabledIds.has(model.id)}
                    disabled={updateMutation.isPending}
                    onToggle={(enabled) => handleToggleModel(model.id, enabled)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
