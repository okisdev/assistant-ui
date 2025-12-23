"use client";

import type { FC } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_MODELS } from "@/lib/models";
import { useModelSelection } from "@/hooks/use-model-selection";
import { cn } from "@/lib/utils";

type ModelSelectorProps = {
  className?: string;
  /** Whether to show the full model name or just an abbreviated version */
  compact?: boolean;
};

export const ModelSelector: FC<ModelSelectorProps> = ({
  className,
  compact = false,
}) => {
  const { modelId, model, setModel } = useModelSelection();
  const Icon = model.icon;

  return (
    <Select value={modelId} onValueChange={setModel}>
      <SelectTrigger
        className={cn(
          "h-8 gap-1.5 border-none bg-transparent px-2 text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground focus:ring-0",
          compact && "w-auto",
          className,
        )}
        size="sm"
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <Icon className="mr-3.5 size-3.5 fill-current" />
            <span className={cn(compact && "sr-only")}>{model.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {AVAILABLE_MODELS.map((m) => {
          const ItemIcon = m.icon;
          return (
            <SelectItem key={m.id} value={m.id}>
              <div className="flex items-center gap-2">
                <ItemIcon className="mr-2 size-3.5 fill-current" />
                <div className="flex flex-col">
                  <span>{m.name}</span>
                  {m.description && (
                    <span className="text-muted-foreground text-xs">
                      {m.description}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export const ModelSelectorCompact: FC<{ className?: string }> = ({
  className,
}) => {
  return <ModelSelector className={className} compact />;
};
