"use client";

import { type FC, memo, useCallback, useRef, useState } from "react";
import { ChevronDownIcon, SparklesIcon } from "lucide-react";
import { useScrollLock } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ANIMATION_DURATION = 200;

type ChainOfThoughtContentProps = {
  text: string;
  isStreaming?: boolean;
};

const ChainOfThoughtContentImpl: FC<ChainOfThoughtContentProps> = ({
  text,
  isStreaming = false,
}) => {
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
          "group/trigger flex w-full items-start gap-2.5 bg-amber-500/5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-amber-500/10",
          isOpen && "bg-amber-500/8",
        )}
      >
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-medium text-amber-700 dark:text-amber-400",
                isStreaming && "shimmer motion-reduce:animate-none",
              )}
            >
              {isStreaming ? "Thinking..." : "Chain of Thought"}
            </span>
          </div>
        </div>
        <ChevronDownIcon
          className={cn(
            "mt-0.5 size-4 shrink-0 text-amber-600 transition-transform duration-(--animation-duration) ease-out dark:text-amber-500",
            isOpen ? "rotate-0" : "-rotate-90",
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent
        className={cn(
          "group/content relative overflow-hidden",
          "bg-amber-500/5",
          "data-[state=closed]:animate-collapsible-up",
          "data-[state=open]:animate-collapsible-down",
          "data-[state=closed]:fill-mode-forwards",
          "data-[state=open]:duration-(--animation-duration)",
          "data-[state=closed]:duration-(--animation-duration)",
        )}
      >
        <div
          className={cn(
            "relative z-0 p-3 pl-[38px] text-amber-800 text-sm leading-relaxed dark:text-amber-200/80",
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
          <ChainOfThoughtMarkdown text={text} />
        </div>
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8",
            "bg-linear-to-t from-amber-500/5 to-transparent",
            "opacity-0",
            "group-data-[state=closed]/content:opacity-100",
            "transition-opacity duration-(--animation-duration)",
          )}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

const ChainOfThoughtMarkdown: FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <p key={index} className="pl-2">
              {trimmed}
            </p>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <p key={index} className="pl-4">
              {trimmed}
            </p>
          );
        }

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        return <p key={index}>{trimmed}</p>;
      })}
    </div>
  );
};

export const ChainOfThoughtContent = memo(ChainOfThoughtContentImpl);
