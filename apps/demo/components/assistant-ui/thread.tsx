"use client";

import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAutoGenerateTitle } from "@/hooks/ai/use-auto-generate-title";
import {
  ActionBarPrimitive,
  AssistantIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAssistantState,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowRight,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  LoaderIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";
import type { FC } from "react";

type ThreadProps = {
  welcomeMessage?: string;
};

export const Thread: FC<ThreadProps> = ({ welcomeMessage }) => {
  useAutoGenerateTitle();

  return (
    <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
      <AssistantIf condition={({ thread }) => !thread.isEmpty}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-background via-60% via-background/80 to-transparent dark:via-50%" />
      </AssistantIf>

      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth px-4"
      >
        <AssistantIf condition={({ thread }) => thread.isEmpty}>
          <ThreadWelcome message={welcomeMessage} />
        </AssistantIf>

        <AssistantIf condition={({ thread }) => !thread.isEmpty}>
          <div className="h-8 shrink-0" />
        </AssistantIf>

        <div className="mx-auto w-full max-w-2xl">
          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              EditComposer,
              AssistantMessage,
            }}
          />
        </div>

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mx-auto mt-auto w-full max-w-2xl bg-background pt-2 pb-4">
          <AssistantIf condition={({ thread }) => !thread.isEmpty}>
            <div className="-top-12 pointer-events-none absolute inset-x-0 h-12 bg-linear-to-t from-background to-transparent" />
          </AssistantIf>
          <ThreadScrollToBottom />
          <AssistantIf condition={({ thread }) => !thread.isEmpty}>
            <div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
              <Composer />
            </div>
          </AssistantIf>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="-top-10 absolute right-4 z-10 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

type ThreadWelcomeProps = {
  message?: string;
};

const ThreadWelcome: FC<ThreadWelcomeProps> = ({ message }) => {
  return (
    <div className="fade-in mx-auto flex w-full max-w-2xl flex-1 animate-in flex-col items-center justify-center gap-8 duration-300">
      <h1 className="fade-in slide-in-from-bottom-2 animate-in text-center font-medium text-3xl tracking-tight duration-500">
        {message || "What can I help you with?"}
      </h1>
      <div className="fade-in slide-in-from-bottom-4 w-full animate-in fill-mode-both delay-150 duration-500">
        <Composer />
      </div>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="w-full rounded-2xl bg-muted/50 p-4">
      <div className="flex items-center gap-3">
        <ComposerPrimitive.Input
          placeholder="Ask anything..."
          className="flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
          rows={1}
          autoFocus
        />
        <AssistantIf condition={({ thread }) => !thread.isRunning}>
          <ComposerPrimitive.Send asChild>
            <Button size="icon" className="shrink-0 rounded-full">
              <ArrowRight className="size-4" />
            </Button>
          </ComposerPrimitive.Send>
        </AssistantIf>
        <AssistantIf condition={({ thread }) => thread.isRunning}>
          <ComposerPrimitive.Cancel asChild>
            <Button size="icon" className="shrink-0 rounded-full">
              <SquareIcon className="size-3 fill-current" />
            </Button>
          </ComposerPrimitive.Cancel>
        </AssistantIf>
      </div>
    </ComposerPrimitive.Root>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="mt-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
        <ErrorPrimitive.Message className="line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  const isLoading = useAssistantState(({ message }) => {
    if (message.status?.type !== "running") return false;
    const hasTextContent = message.parts.some(
      (part) => part.type === "text" && part.text.length > 0,
    );
    return !hasTextContent;
  });

  return (
    <MessagePrimitive.Root
      className="fade-in slide-in-from-bottom-2 animate-in py-4 duration-300"
      data-role="assistant"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoaderIcon className="size-4 animate-spin" />
          <span className="text-sm">Thinking...</span>
        </div>
      ) : (
        <>
          <div className="text-foreground leading-relaxed">
            <MessagePrimitive.Parts
              components={{
                Text: MarkdownText,
              }}
            />
            <MessageError />
          </div>

          <div className="mt-2 flex">
            <BranchPicker />
            <AssistantActionBar />
          </div>
        </>
      )}
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="-ml-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AssistantIf condition={({ message }) => message.isCopied}>
            <CheckIcon />
          </AssistantIf>
          <AssistantIf condition={({ message }) => !message.isCopied}>
            <CopyIcon />
          </AssistantIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.ExportMarkdown asChild>
        <TooltipIconButton tooltip="Export as Markdown">
          <DownloadIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.ExportMarkdown>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="fade-in slide-in-from-bottom-2 flex animate-in justify-end py-4 duration-300"
      data-role="user"
    >
      <div className="relative max-w-[85%]">
        <div className="rounded-2xl bg-muted px-4 py-2.5 text-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="-translate-x-full -translate-y-1/2 absolute top-1/2 left-0 pr-2">
          <UserActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="flex justify-end py-4">
      <ComposerPrimitive.Root className="flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm">Update</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "-ml-2 mr-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
      {...rest}
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
