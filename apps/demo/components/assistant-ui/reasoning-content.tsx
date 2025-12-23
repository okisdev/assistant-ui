"use client";

import { type FC, memo, useCallback, useRef, useState } from "react";
import { ChevronDownIcon, BrainIcon } from "lucide-react";
import { useMessagePartReasoning, useScrollLock } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";

const ANIMATION_DURATION = 200;

/**
 * Extracts a summary from the reasoning text for display in the collapsed state.
 * Takes the first sentence or first ~60 characters, whichever is shorter.
 */
const extractSummary = (text: string): string | null => {
  if (!text || text.trim().length === 0) return null;

  const trimmed = text.trim();

  // Try to get the first sentence (ending with . ! or ?)
  const sentenceMatch = trimmed.match(/^[^.!?]+[.!?]/);
  if (sentenceMatch && sentenceMatch[0].length <= 80) {
    return sentenceMatch[0].trim();
  }

  // Otherwise, take first ~60 chars and add ellipsis
  if (trimmed.length <= 60) {
    return trimmed;
  }

  // Find a natural break point (space) near 60 chars
  const breakPoint = trimmed.lastIndexOf(" ", 60);
  if (breakPoint > 30) {
    return `${trimmed.slice(0, breakPoint)}…`;
  }

  return `${trimmed.slice(0, 60)}…`;
};

const ReasoningContentImpl: FC = () => {
  const { text, status } = useMessagePartReasoning();
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);

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

  const summary = extractSummary(text);
  const isStreaming = status?.type === "running";

  return (
    <Collapsible
      ref={collapsibleRef}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="my-3 w-full"
      style={
        {
          "--animation-duration": `${ANIMATION_DURATION}ms`,
        } as React.CSSProperties
      }
    >
      <CollapsibleTrigger
        className={cn(
          "group/trigger flex w-full items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
          isOpen && "rounded-b-none bg-muted/50",
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
              Thinking
            </span>
            {!isOpen && summary && (
              <span className="truncate text-muted-foreground">
                · {summary}
              </span>
            )}
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
          "rounded-b-lg bg-muted/50",
          "data-[state=closed]:animate-collapsible-up",
          "data-[state=open]:animate-collapsible-down",
          "data-[state=closed]:fill-mode-forwards",
          "data-[state=open]:duration-(--animation-duration)",
          "data-[state=closed]:duration-(--animation-duration)",
        )}
      >
        <div
          className={cn(
            "relative z-0 px-3 pt-0 pb-3 pl-[38px] text-muted-foreground text-sm leading-relaxed",
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
