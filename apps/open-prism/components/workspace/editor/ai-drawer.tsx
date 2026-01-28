"use client";

import { useRef, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { ImperativePanelHandle } from "react-resizable-panels";
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
  GripHorizontalIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";
import type { FC } from "react";
import remarkGfm from "remark-gfm";

import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";

export function AIDrawer() {
  const threadPanelRef = useRef<ImperativePanelHandle>(null);
  const isThreadOpen = useDocumentStore((s) => s.isThreadOpen);
  const setThreadOpen = useDocumentStore((s) => s.setThreadOpen);

  const expandThread = useCallback(() => {
    if (!isThreadOpen) {
      setThreadOpen(true);
      threadPanelRef.current?.resize(60);
    }
  }, [isThreadOpen, setThreadOpen]);

  const handlePanelResize = useCallback(
    (size: number) => {
      setThreadOpen(size > 5);
    },
    [setThreadOpen],
  );

  return (
    <ThreadPrimitive.Root className="aui-root flex h-full flex-col">
      <PanelGroup direction="vertical">
        {/* Thread Panel - collapsible */}
        <Panel
          ref={threadPanelRef}
          defaultSize={0}
          minSize={0}
          maxSize={80}
          collapsible
          onResize={handlePanelResize}
          className="overflow-hidden"
        >
          <ThreadMessages />
        </Panel>

        <PanelResizeHandle className="group relative flex h-2 items-center justify-center border-border border-t bg-background transition-colors hover:bg-muted">
          <GripHorizontalIcon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </PanelResizeHandle>

        {/* Composer - always visible */}
        <Panel defaultSize={100} minSize={15}>
          <Composer onSend={expandThread} />
        </Panel>
      </PanelGroup>
    </ThreadPrimitive.Root>
  );
}

const ThreadMessages: FC = () => {
  return (
    <ThreadPrimitive.Viewport
      turnAnchor="top"
      className="aui-thread-viewport relative flex h-full flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
    >
      <AuiIf condition={({ thread }) => thread.isEmpty}>
        <ThreadWelcome />
      </AuiIf>

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

const ThreadWelcome: FC = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <p className="text-center text-muted-foreground text-sm">
        Ask me anything about LaTeX!
      </p>
    </div>
  );
};

const Composer: FC<{ onSend?: () => void }> = ({ onSend }) => {
  return (
    <div className="flex h-full flex-col border-border border-t bg-background p-3">
      <ComposerPrimitive.Root className="relative flex w-full flex-1 flex-col">
        <div className="flex w-full flex-1 flex-col rounded-xl border border-input bg-background px-1 pt-1 outline-none transition-shadow has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20">
          <ComposerPrimitive.Input
            placeholder="Ask about LaTeX..."
            className="max-h-24 min-h-10 w-full flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            rows={1}
            autoFocus
            aria-label="Message input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                onSend?.();
              }
            }}
          />
          <ComposerAction />
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="relative mx-2 mb-2 flex items-center justify-end">
      <AuiIf condition={({ thread }) => !thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send message"
            side="top"
            type="submit"
            variant="default"
            size="icon"
            className="size-7 rounded-full"
            aria-label="Send message"
          >
            <ArrowUpIcon className="size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={({ thread }) => thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="size-7 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
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
