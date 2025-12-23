"use client";

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
  AVAILABLE_MODELS,
  DEFAULT_MODEL_ID,
  isValidModelId,
} from "@/lib/ai/models";

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
  const { data: capabilities, isLoading } = api.user.getCapabilities.useQuery();
  const utils = api.useUtils();

  const updateCapabilitiesMutation = api.user.updateCapabilities.useMutation({
    onSuccess: () => {
      utils.user.getCapabilities.invalidate();
      toast.success("Default model updated");
    },
    onError: () => {
      toast.error("Failed to update default model");
    },
  });

  const handleModelChange = (modelId: string) => {
    if (!isValidModelId(modelId)) return;
    updateCapabilitiesMutation.mutate({ defaultModel: modelId });
  };

  const currentModel = capabilities?.defaultModel ?? DEFAULT_MODEL_ID;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-medium text-xl tracking-tight">AI Model</h1>

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
            value={currentModel}
            onValueChange={handleModelChange}
            disabled={updateCapabilitiesMutation.isPending}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
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
