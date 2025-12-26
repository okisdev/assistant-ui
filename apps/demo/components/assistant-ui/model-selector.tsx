"use client";

import type { FC } from "react";
import { BrainIcon, ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModelSelection } from "@/contexts/model-selection-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const ModelSelector: FC<{ className?: string }> = ({ className }) => {
  const { modelId, model, setModel, enabledModels } = useModelSelection();
  const Icon = model.icon;

  return (
    <Select value={modelId} onValueChange={setModel}>
      <SelectTrigger
        className={cn(
          "h-8 gap-1.5 border-none bg-transparent px-2 text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground focus:ring-0",
          className,
        )}
        size="sm"
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <Icon className="size-3.5 fill-current" />
            <span>{model.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        className="min-w-[260px] rounded-xl p-2 shadow-lg"
      >
        {enabledModels.map((m) => {
          const ItemIcon = m.icon;
          const hasVision = m.capabilities.includes("image");
          const hasReasoning = m.capabilities.includes("reasoning");

          return (
            <SelectItem
              key={m.id}
              value={m.id}
              className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
            >
              <ItemIcon className="size-4 fill-current" />
              <span className="flex-1">{m.name}</span>
              {(hasVision || hasReasoning) && (
                <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                  {hasVision && <ImageIcon className="size-3.5" />}
                  {hasReasoning && <BrainIcon className="size-3.5" />}
                </span>
              )}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export const ReasoningToggle: FC<{ className?: string }> = ({ className }) => {
  const { model, reasoningEnabled, setReasoningEnabled } = useModelSelection();

  if (!model.capabilities.includes("reasoning")) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setReasoningEnabled(!reasoningEnabled)}
          className={cn(
            "transition-colors",
            reasoningEnabled ? "text-emerald-500" : "text-muted-foreground",
            className,
          )}
        >
          <BrainIcon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{reasoningEnabled ? "Reasoning enabled" : "Reasoning disabled"}</p>
      </TooltipContent>
    </Tooltip>
  );
};
