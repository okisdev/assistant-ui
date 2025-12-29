"use client";

import { useState, useMemo, type ComponentType, type SVGProps } from "react";
import {
  ChevronRight,
  Search,
  MessageSquare,
  ImageIcon,
  Eye,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CHAT_MODELS,
  IMAGE_GEN_MODELS,
  formatContextWindow,
  type ModelDefinition,
  type ModelCapability,
  type ChatModelDefinition,
  type ImageGenModelDefinition,
  type ModelProvider,
} from "@/lib/ai/models";
import { SettingHeader } from "@/components/dashboard/setting-header";
import { cn } from "@/lib/utils";
import { OpenAI } from "@/components/icons/openai";
import { XAI } from "@/components/icons/xai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============================================
// CAPABILITY BADGE COMPONENT
// ============================================

type CapabilityBadgeProps = {
  capability: ModelCapability;
};

function CapabilityBadge({ capability }: CapabilityBadgeProps) {
  const config: Record<
    ModelCapability,
    { label: string; icon: typeof Eye; className: string }
  > = {
    text: {
      label: "Text",
      icon: MessageSquare,
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    vision: {
      label: "Vision",
      icon: Eye,
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    reasoning: {
      label: "Reasoning",
      icon: Sparkles,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    "image-generation": {
      label: "Image Gen",
      icon: ImageIcon,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  };

  const { label, icon: Icon, className } = config[capability];

  return (
    <Badge variant="secondary" className={cn("gap-1 font-normal", className)}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}

// ============================================
// PRICING DISPLAY
// ============================================

function formatPrice(price: number): string {
  if (price < 1) return `$${price.toFixed(2)}`;
  return `$${price}`;
}

function PricingDisplay({ model }: { model: ModelDefinition }) {
  if (model.type === "image-generation") {
    const perImage = model.pricing.perImage;
    if (!perImage) return null;
    return (
      <span className="text-muted-foreground text-xs">
        {formatPrice(perImage)}/image
      </span>
    );
  }

  const { input, output } = model.pricing;
  if (!input || !output) return null;

  return (
    <span className="text-muted-foreground text-xs">
      {formatPrice(input)} / {formatPrice(output)} per 1M tokens
    </span>
  );
}

// ============================================
// MODEL ROW COMPONENT
// ============================================

type ModelRowProps<T extends ModelDefinition> = {
  model: T;
  enabled: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
  highlighted?: boolean;
};

function ModelRow<T extends ModelDefinition>({
  model,
  enabled,
  disabled,
  onToggle,
  highlighted,
}: ModelRowProps<T>) {
  const Icon = model.icon;

  // Filter out 'text' capability since it's implied for chat models
  const displayCapabilities = model.capabilities.filter((c) => c !== "text");

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
        highlighted
          ? "bg-primary/5 ring-1 ring-primary/20"
          : "bg-muted/50 hover:bg-muted/70",
      )}
    >
      <div className="flex items-start gap-3 sm:items-center">
        <Icon className="mt-0.5 size-5 shrink-0 fill-current text-muted-foreground sm:mt-0" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{model.name}</span>
            {model.deprecated && (
              <Badge variant="outline" className="text-muted-foreground">
                Deprecated
              </Badge>
            )}
            {model.primary && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                Primary
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {displayCapabilities.map((cap) => (
              <CapabilityBadge key={cap} capability={cap} />
            ))}
            {displayCapabilities.length > 0 && (
              <span className="mx-1 text-muted-foreground/50">•</span>
            )}
            {model.contextWindow && (
              <>
                <span className="text-muted-foreground text-xs">
                  {formatContextWindow(model.contextWindow)} ctx
                </span>
                <span className="mx-1 text-muted-foreground/50">•</span>
              </>
            )}
            <PricingDisplay model={model} />
          </div>
        </div>
      </div>

      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled || model.deprecated}
        className="shrink-0"
      />
    </div>
  );
}

// ============================================
// IMAGE MODEL ROW (specialized for image gen)
// ============================================

function ImageModelRow({
  model,
  enabled,
  disabled,
  onToggle,
  highlighted,
}: ModelRowProps<ImageGenModelDefinition>) {
  const Icon = model.icon;
  const sizes = model.imageGenConfig?.sizes ?? [];

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
        highlighted
          ? "bg-primary/5 ring-1 ring-primary/20"
          : "bg-muted/50 hover:bg-muted/70",
      )}
    >
      <div className="flex items-start gap-3 sm:items-center">
        <Icon className="mt-0.5 size-5 shrink-0 fill-current text-muted-foreground sm:mt-0" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{model.name}</span>
            {model.primary && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                Recommended
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <CapabilityBadge capability="image-generation" />
            <span className="mx-1 text-muted-foreground/50">•</span>
            <PricingDisplay model={model} />
            {sizes.length > 0 && (
              <>
                <span className="mx-1 text-muted-foreground/50">•</span>
                <span className="text-muted-foreground text-xs">
                  {sizes.join(", ")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}

// ============================================
// PROVIDER GROUP COMPONENT
// ============================================

const PROVIDER_INFO: Record<
  ModelProvider,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  openai: { label: "OpenAI", icon: OpenAI },
  xai: { label: "xAI", icon: XAI },
};

type ProviderGroupProps<T extends ModelDefinition> = {
  provider: ModelProvider;
  models: T[];
  enabledIds: Set<string>;
  disabled: boolean;
  isLoading: boolean;
  onToggleModel: (modelId: string, enabled: boolean) => void;
  searchQuery: string;
  renderRow: (props: {
    model: T;
    enabled: boolean;
    disabled: boolean;
    onToggle: (enabled: boolean) => void;
    highlighted: boolean;
  }) => React.ReactNode;
};

function ProviderGroup<T extends ModelDefinition>({
  provider,
  models,
  enabledIds,
  disabled,
  isLoading,
  onToggleModel,
  searchQuery,
  renderRow,
}: ProviderGroupProps<T>) {
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
            <span className="ml-auto text-muted-foreground text-sm">
              {enabledCount}/{models.length} enabled
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 flex flex-col gap-2 pl-7">
          {models.map((model) =>
            renderRow({
              model,
              enabled: enabledIds.has(model.id),
              disabled,
              onToggle: (enabled) => onToggleModel(model.id, enabled),
              highlighted: searchQuery
                ? model.name.toLowerCase().includes(searchQuery.toLowerCase())
                : false,
            }),
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// CHAT MODELS TAB
// ============================================

type ChatModelsTabProps = {
  searchQuery: string;
  showDeprecated: boolean;
  enabledIds: Set<string>;
  isLoading: boolean;
  isPending: boolean;
  onToggleModel: (modelId: string, enabled: boolean) => void;
};

function ChatModelsTab({
  searchQuery,
  showDeprecated,
  enabledIds,
  isLoading,
  isPending,
  onToggleModel,
}: ChatModelsTabProps) {
  const filteredModels = useMemo(() => {
    return CHAT_MODELS.filter((m) => {
      if (!showDeprecated && m.deprecated) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(query) ||
          m.provider.toLowerCase().includes(query) ||
          m.capabilities.some((c) => c.includes(query))
        );
      }

      return true;
    });
  }, [showDeprecated, searchQuery]);

  const groupedModels = useMemo(() => {
    const groups = new Map<ModelProvider, ChatModelDefinition[]>();
    for (const model of filteredModels) {
      const existing = groups.get(model.provider) ?? [];
      groups.set(model.provider, [...existing, model]);
    }
    return groups;
  }, [filteredModels]);

  const providers = useMemo(() => {
    const order: ModelProvider[] = ["openai", "xai"];
    return order.filter((p) => groupedModels.has(p));
  }, [groupedModels]);

  if (providers.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <MessageSquare className="size-8 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">No chat models found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => (
        <ProviderGroup
          key={provider}
          provider={provider}
          models={groupedModels.get(provider) ?? []}
          enabledIds={enabledIds}
          disabled={isLoading || isPending}
          isLoading={isLoading}
          onToggleModel={onToggleModel}
          searchQuery={searchQuery}
          renderRow={(props) => <ModelRow key={props.model.id} {...props} />}
        />
      ))}
    </div>
  );
}

// ============================================
// IMAGE GENERATION MODELS TAB
// ============================================

type ImageModelsTabProps = {
  searchQuery: string;
  enabledIds: Set<string>;
  isLoading: boolean;
  isPending: boolean;
  onToggleModel: (modelId: string, enabled: boolean) => void;
};

function ImageModelsTab({
  searchQuery,
  enabledIds,
  isLoading,
  isPending,
  onToggleModel,
}: ImageModelsTabProps) {
  const filteredModels = useMemo(() => {
    if (!searchQuery) return IMAGE_GEN_MODELS;

    const query = searchQuery.toLowerCase();
    return IMAGE_GEN_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const groupedModels = useMemo(() => {
    const groups = new Map<ModelProvider, ImageGenModelDefinition[]>();
    for (const model of filteredModels) {
      const existing = groups.get(model.provider) ?? [];
      groups.set(model.provider, [...existing, model]);
    }
    return groups;
  }, [filteredModels]);

  const providers = useMemo(() => {
    const order: ModelProvider[] = ["openai", "xai"];
    return order.filter((p) => groupedModels.has(p));
  }, [groupedModels]);

  if (providers.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <ImageIcon className="size-8 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">
          No image generation models found
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => (
        <ProviderGroup
          key={provider}
          provider={provider}
          models={groupedModels.get(provider) ?? []}
          enabledIds={enabledIds}
          disabled={isLoading || isPending}
          isLoading={isLoading}
          onToggleModel={onToggleModel}
          searchQuery={searchQuery}
          renderRow={(props) => (
            <ImageModelRow key={props.model.id} {...props} />
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

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

  // Chat models enabled IDs
  const enabledChatIds = useMemo(
    () => new Set(capabilities?.models.enabledIds ?? []),
    [capabilities?.models.enabledIds],
  );

  // Image models enabled IDs (for now, enable all if image generation is enabled)
  const enabledImageIds = useMemo(() => {
    const enabled = capabilities?.tools.imageGeneration ?? true;
    if (!enabled) return new Set<string>();
    // All image models are enabled if the feature is on
    return new Set(IMAGE_GEN_MODELS.map((m) => m.id));
  }, [capabilities?.tools.imageGeneration]);

  const handleToggleChatModel = (modelId: string, enabled: boolean) => {
    const currentIds = capabilities?.models.enabledIds ?? [];
    const newIds = enabled
      ? [...currentIds, modelId]
      : currentIds.filter((id) => id !== modelId);

    updateMutation.mutate({ models: { enabledIds: newIds } });
  };

  const handleToggleImageModel = (_modelId: string, enabled: boolean) => {
    // For now, toggle the image generation capability as a whole
    // In the future, this could be per-model
    updateMutation.mutate({ tools: { imageGeneration: enabled } });
  };

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

  const chatCount = CHAT_MODELS.filter((m) => !m.deprecated).length;
  const imageCount = IMAGE_GEN_MODELS.length;

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

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="size-4" />
            Chat Models
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {chatCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-2">
            <ImageIcon className="size-4" />
            Image Generation
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {imageCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0">
          <ChatModelsTab
            searchQuery={searchQuery}
            showDeprecated={showDeprecated}
            enabledIds={enabledChatIds}
            isLoading={isLoading}
            isPending={updateMutation.isPending}
            onToggleModel={handleToggleChatModel}
          />
        </TabsContent>

        <TabsContent value="image" className="mt-0">
          <ImageModelsTab
            searchQuery={searchQuery}
            enabledIds={enabledImageIds}
            isLoading={isLoading}
            isPending={updateMutation.isPending}
            onToggleModel={handleToggleImageModel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
