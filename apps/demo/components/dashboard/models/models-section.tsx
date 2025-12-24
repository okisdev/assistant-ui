"use client";

import { useState, useMemo, type ComponentType, type SVGProps } from "react";
import { ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AVAILABLE_MODELS,
  type ModelDefinition,
  type ModelProvider,
} from "@/lib/ai/models";
import { SettingHeader } from "@/components/dashboard/setting-header";
import { cn } from "@/lib/utils";
import { OpenAI } from "@/components/icons/openai";
import { XAI } from "@/components/icons/xai";

function ModelRow({
  model,
  enabled,
  disabled,
  onToggle,
  highlighted,
}: {
  model: ModelDefinition;
  enabled: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
  highlighted?: boolean;
}) {
  const Icon = model.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg px-4 py-3 transition-colors",
        highlighted ? "bg-primary/5" : "bg-muted/50",
      )}
    >
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
        disabled={disabled || model.deprecated}
      />
    </div>
  );
}

const PROVIDER_INFO: Record<
  ModelProvider,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  openai: { label: "OpenAI", icon: OpenAI },
  xai: { label: "xAI", icon: XAI },
};

type ProviderGroupProps = {
  provider: ModelProvider;
  models: ModelDefinition[];
  enabledIds: Set<string>;
  disabled: boolean;
  isLoading: boolean;
  onToggleModel: (modelId: string, enabled: boolean) => void;
  searchQuery: string;
};

function ProviderGroup({
  provider,
  models,
  enabledIds,
  disabled,
  isLoading,
  onToggleModel,
  searchQuery,
}: ProviderGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  const enabledCount = models.filter((m) => enabledIds.has(m.id)).length;
  const { label, icon: ProviderIcon } = PROVIDER_INFO[provider];

  // Auto-expand when searching
  const shouldBeOpen = searchQuery ? true : isOpen;

  return (
    <Collapsible open={shouldBeOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-lg bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              shouldBeOpen && "rotate-90",
            )}
          />
          <ProviderIcon className="size-4 shrink-0 fill-current" />
          <span className="font-medium text-sm">{label}</span>
          {!isLoading && (
            <span className="text-muted-foreground text-sm">
              {enabledCount > 0 ? `${enabledCount} enabled` : ""}
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 flex flex-col gap-2 pl-7">
          {models.map((model) => (
            <ModelRow
              key={model.id}
              model={model}
              enabled={enabledIds.has(model.id)}
              disabled={disabled}
              onToggle={(enabled) => onToggleModel(model.id, enabled)}
              highlighted={
                searchQuery
                  ? model.name.toLowerCase().includes(searchQuery.toLowerCase())
                  : false
              }
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ModelsSection() {
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    return AVAILABLE_MODELS.filter((m) => {
      // Filter by deprecated
      if (!showDeprecated && m.deprecated) return false;

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.provider.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [showDeprecated, searchQuery]);

  const groupedModels = useMemo(() => {
    const groups = new Map<ModelProvider, ModelDefinition[]>();

    for (const model of filteredModels) {
      const existing = groups.get(model.provider) ?? [];
      groups.set(model.provider, [...existing, model]);
    }

    return groups;
  }, [filteredModels]);

  // Get providers in consistent order
  const providers = useMemo(() => {
    const order: ModelProvider[] = ["openai", "xai"];
    return order.filter((p) => groupedModels.has(p));
  }, [groupedModels]);

  const modelsAction = (
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
  );

  return (
    <div className="flex flex-col gap-6">
      <SettingHeader title="Models" action={modelsAction} />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {providers.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-muted-foreground text-sm">No models found</p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-primary text-sm hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {providers.map((provider) => (
            <ProviderGroup
              key={provider}
              provider={provider}
              models={groupedModels.get(provider) ?? []}
              enabledIds={enabledIds}
              disabled={isLoading || updateMutation.isPending}
              isLoading={isLoading}
              onToggleModel={handleToggleModel}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
