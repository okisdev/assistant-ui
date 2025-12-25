"use client";

import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { SettingHeader } from "@/components/dashboard/setting-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChainOfThoughtMode } from "@/lib/database/types";

const COT_OPTIONS: Array<{
  value: ChainOfThoughtMode;
  label: string;
  description: string;
}> = [
  {
    value: "off",
    label: "Off",
    description: "No chain of thought prompting",
  },
  {
    value: "auto",
    label: "Auto",
    description: "AI decides when to show reasoning",
  },
  {
    value: "always",
    label: "Always",
    description: "Always show step-by-step reasoning",
  },
];

export function ChainOfThoughtSection() {
  const { data: capabilities, isLoading: isCapabilitiesLoading } =
    api.user.capability.list.useQuery();
  const utils = api.useUtils();

  const updateCapabilitiesMutation = api.user.capability.update.useMutation({
    onSuccess: () => {
      utils.user.capability.list.invalidate();
      toast.success("Chain of Thought setting updated");
    },
    onError: () => {
      toast.error("Failed to update setting");
    },
  });

  const handleChange = (value: ChainOfThoughtMode) => {
    updateCapabilitiesMutation.mutate({ prompting: { chainOfThought: value } });
  };

  const currentValue = capabilities?.prompting.chainOfThought ?? "off";
  const currentOption = COT_OPTIONS.find((opt) => opt.value === currentValue);

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Chain of Thought" />

      {isCapabilitiesLoading ? (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex flex-col gap-1">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">Reasoning mode</span>
            <p className="text-muted-foreground text-xs">
              {currentOption?.description ??
                "Prompting technique that guides AI to think step by step"}
            </p>
          </div>
          <Select
            value={currentValue}
            onValueChange={handleChange}
            disabled={updateCapabilitiesMutation.isPending}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Chain of Thought prompting improves AI reasoning by guiding the model to
        break down problems into steps. <strong>Auto</strong> lets the AI decide
        when reasoning is helpful. <strong>Always</strong> forces step-by-step
        thinking for every response.
      </p>
    </div>
  );
}
