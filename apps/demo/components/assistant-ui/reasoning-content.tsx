"use client";

import { type FC, memo, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon, BrainIcon } from "lucide-react";
import { useMessagePartReasoning, useScrollLock } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/ai/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";

const ANIMATION_DURATION = 200;

const ReasoningContentImpl: FC = () => {
  const { text, status } = useMessagePartReasoning();
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);

  const startTimeRef = useRef<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const isStreaming = status?.type === "running";

  useEffect(() => {
    if (isStreaming && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      setDuration(null);
    } else if (!isStreaming && startTimeRef.current !== null) {
      const elapsed = Date.now() - startTimeRef.current;
      setDuration(elapsed);
    }
  }, [isStreaming]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        lockScroll();
      }
      setIsOpen(open);
    },
    [lockScroll],
  );

  if (!text || text.trim().length === 0) {
    return null;
  }

  return (
    <Collapsible
      ref={collapsibleRef}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="my-3 w-full overflow-hidden rounded-lg"
      style={
        {
          "--animation-duration": `${ANIMATION_DURATION}ms`,
        } as React.CSSProperties
      }
    >
      <CollapsibleTrigger
        className={cn(
          "group/trigger flex w-full items-start gap-2.5 bg-muted/40 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
          isOpen && "bg-muted/50",
        )}
      >
        <BrainIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-medium text-foreground",
                isStreaming && "shimmer motion-reduce:animate-none",
              )}
            >
              {isStreaming
                ? "Thinking..."
                : duration !== null
                  ? `Thought for ${formatTime(duration)}`
                  : "Thought"}
            </span>
          </div>
        </div>
        <ChevronDownIcon
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-(--animation-duration) ease-out",
            isOpen ? "rotate-0" : "-rotate-90",
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent
        className={cn(
          "group/content relative overflow-hidden",
          "bg-muted/50",
          "data-[state=closed]:animate-collapsible-up",
          "data-[state=open]:animate-collapsible-down",
          "data-[state=closed]:fill-mode-forwards",
          "data-[state=open]:duration-(--animation-duration)",
          "data-[state=closed]:duration-(--animation-duration)",
        )}
      >
        <div
          className={cn(
            "relative z-0 p-3 pl-[38px] text-muted-foreground text-sm leading-relaxed",
            "transform-gpu transition-[transform,opacity]",
            "group-data-[state=open]/content:animate-in",
            "group-data-[state=closed]/content:animate-out",
            "group-data-[state=open]/content:fade-in-0",
            "group-data-[state=closed]/content:fade-out-0",
            "group-data-[state=open]/content:slide-in-from-top-2",
            "group-data-[state=closed]/content:slide-out-to-top-2",
            "group-data-[state=open]/content:duration-(--animation-duration)",
            "group-data-[state=closed]/content:duration-(--animation-duration)",
          )}
        >
          <MarkdownText />
        </div>
        {/* Gradient fade at the bottom for better visual transition */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8",
            "bg-linear-to-t from-muted/50 to-transparent",
            "opacity-0",
            "group-data-[state=closed]/content:opacity-100",
            "transition-opacity duration-(--animation-duration)",
          )}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export const ReasoningContent = memo(ReasoningContentImpl);
