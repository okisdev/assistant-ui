"use client";

import { toast } from "sonner";

import { SettingHeader } from "@/components/dashboard/setting-header";
import { SettingRowSwitch } from "@/components/dashboard/setting-row";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMAGE_MODELS, type ImageModelId } from "@/lib/ai/models";
import { api } from "@/utils/trpc/client";

export function ImageGenerationSection() {
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

  const handleToggleImageGeneration = (enabled: boolean) => {
    updateCapabilitiesMutation.mutate({ tools: { imageGeneration: enabled } });
  };

  const handleModelChange = (modelId: ImageModelId) => {
    updateCapabilitiesMutation.mutate({
      tools: { defaultImageModel: modelId },
    });
  };

  const imageGenerationEnabled = capabilities?.tools.imageGeneration ?? true;
  const defaultImageModel = capabilities?.tools.defaultImageModel ?? "dall-e-2";

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Image Generation" />

      <div className="flex flex-col gap-2">
        <SettingRowSwitch
          title="Image generation"
          description="AI can generate images based on your text descriptions"
          checked={imageGenerationEnabled}
          disabled={
            isCapabilitiesLoading || updateCapabilitiesMutation.isPending
          }
          onCheckedChange={handleToggleImageGeneration}
        />

        {imageGenerationEnabled && (
          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <Label className="font-medium text-sm">Default model</Label>
              <p className="text-muted-foreground text-xs">
                Select the default image generation
              </p>
            </div>
            <Select
              value={defaultImageModel}
              onValueChange={handleModelChange}
              disabled={
                isCapabilitiesLoading || updateCapabilitiesMutation.isPending
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
