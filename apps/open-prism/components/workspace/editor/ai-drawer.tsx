"use client";

import { useRef, useState, useCallback } from "react";
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";
import type { FC } from "react";
import remarkGfm from "remark-gfm";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

const MIN_HEIGHT = 140;
const DEFAULT_HEIGHT = 180;

export function AIDrawer() {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startY = e.clientY;
      const startHeight = height;

      const handleMouseMove = (e: MouseEvent) => {
        const parent = containerRef.current?.parentElement;
        const maxHeight = parent ? parent.clientHeight * 0.5 : 400;
        const delta = startY - e.clientY;
        const newHeight = Math.min(
          Math.max(startHeight + delta, MIN_HEIGHT),
          maxHeight,
        );
        setHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [height],
  );

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 pb-6"
    >
      <ThreadPrimitive.Root
        className="aui-root pointer-events-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
        style={{ height }}
        data-dragging={isDragging}
      >
        {/* Drag handle */}
        <div
          className="flex cursor-row-resize items-center justify-center p-2 hover:bg-muted/50"
          onMouseDown={handleMouseDown}
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Thread messages */}
        <ThreadMessages />

        {/* Composer */}
        <Composer />
      </ThreadPrimitive.Root>
    </div>
  );
}

const ThreadMessages: FC = () => {
  return (
    <ThreadPrimitive.Viewport
      turnAnchor="end"
      className="aui-thread-viewport relative min-h-0 flex-1 overflow-y-auto scroll-smooth px-4"
    >
      <ThreadPrimitive.Messages
        components={{
          UserMessage,
          AssistantMessage,
        }}
      />

      <ThreadScrollToBottom />
    </ThreadPrimitive.Viewport>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute right-4 bottom-2 z-10 rounded-full p-2 disabled:invisible dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon className="size-4" />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="shrink-0 border-border border-t p-3">
      <div className="flex w-full flex-col rounded-2xl border border-input bg-muted/30 transition-colors focus-within:border-ring focus-within:bg-background">
        <ComposerPrimitive.Input
          placeholder="Ask about LaTeX..."
          className="max-h-24 min-h-10 w-full resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <div className="flex items-center justify-end px-2 pb-2">
          <ComposerAction />
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <>
      <AuiIf condition={({ thread }) => !thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            side="top"
            type="submit"
            variant="default"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Send message"
          >
            <ArrowUpIcon className="size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={({ thread }) => thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Stop"
            side="top"
            variant="secondary"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="size-3 fill-current" />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="relative w-full py-3"
      data-role="assistant"
    >
      <div className="px-2 text-foreground leading-relaxed">
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
          }}
        />
      </div>

      <div className="mt-1 ml-2 flex">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const MarkdownText: FC = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      className="aui-md prose prose-sm dark:prose-invert max-w-none"
    />
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="-ml-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={({ message }) => message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={({ message }) => !message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Regenerate">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="flex w-full flex-col items-end py-3"
      data-role="user"
    >
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-foreground">
        <MessagePrimitive.Parts />
      </div>
      <BranchPicker className="mr-2 justify-end" />
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<{ className?: string }> = ({ className }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
