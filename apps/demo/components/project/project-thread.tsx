"use client";

import type { FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  MessagesSquare,
  ChevronRight,
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
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import {
  ActionBarPrimitive,
  AssistantIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAssistantApi,
  useAssistantState,
} from "@assistant-ui/react";

import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAutoGenerateTitle } from "@/hooks/ai/use-auto-generate-title";
import { useSyncFeedback } from "@/hooks/use-sync-feedback";
import { api } from "@/utils/trpc/client";

type ProjectThreadProps = {
  projectId: string;
  welcomeMessage?: string;
};

export const ProjectThread: FC<ProjectThreadProps> = ({
  projectId,
  welcomeMessage,
}) => {
  useAutoGenerateTitle();
  useSyncFeedback();

  return (
    <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
      <AssistantIf condition={({ thread }) => !thread.isEmpty}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-background via-60% via-background/80 to-transparent dark:via-50%" />
      </AssistantIf>

      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth"
      >
        <AssistantIf condition={({ thread }) => thread.isEmpty}>
          <ProjectWelcome
            projectId={projectId}
            welcomeMessage={welcomeMessage}
          />
        </AssistantIf>

        <AssistantIf condition={({ thread }) => !thread.isEmpty}>
          <div className="h-16 shrink-0" />
        </AssistantIf>

        <div className="mx-auto w-full max-w-2xl px-4 pb-12">
          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              EditComposer,
              AssistantMessage,
            }}
          />
        </div>

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mx-auto mt-auto w-full max-w-2xl bg-background px-4 pt-4 pb-4">
          <AssistantIf condition={({ thread }) => !thread.isEmpty}>
            <div className="pointer-events-none absolute inset-x-0 -top-12 h-12 bg-linear-to-t from-background to-transparent" />
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

// Project-specific welcome component - aligned at top, not centered
function ProjectWelcome({
  projectId,
  welcomeMessage,
}: {
  projectId: string;
  welcomeMessage?: string;
}) {
  return (
    <div className="flex flex-col pt-16">
      <div className="fade-in mx-auto w-full max-w-2xl animate-in px-4 duration-300">
        <div className="space-y-8">
          <h1 className="fade-in slide-in-from-bottom-2 animate-in text-center font-medium text-3xl tracking-tight duration-500">
            {welcomeMessage || "What can I help you with?"}
          </h1>
          <div className="fade-in slide-in-from-bottom-4 animate-in fill-mode-both delay-150 duration-500">
            <Composer />
          </div>
        </div>
      </div>
      <ProjectConversationsList projectId={projectId} />
    </div>
  );
}

function ProjectConversationsList({ projectId }: { projectId: string }) {
  const { data: chats, isLoading } = api.chat.list.useQuery({
    projectId,
  });

  // Filter out chats without title (new/empty chats)
  const conversationsWithTitle = chats?.filter((chat) => chat.title);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-12">
        <ConversationsListSkeleton />
      </div>
    );
  }

  if (!conversationsWithTitle || conversationsWithTitle.length === 0) {
    return null;
  }

  return (
    <div className="fade-in slide-in-from-bottom-4 mx-auto w-full max-w-2xl animate-in fill-mode-both px-4 pt-12 pb-8 delay-300 duration-500">
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
          <MessagesSquare className="size-4" />
          Recent conversations
        </h2>
        <div className="space-y-1">
          {conversationsWithTitle.slice(0, 5).map((chat) => (
            <ConversationItem key={chat.id} chat={chat} />
          ))}
        </div>
        {conversationsWithTitle.length > 5 && (
          <Link
            href="/chats"
            className="group flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            View all ({conversationsWithTitle.length})
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

type ChatData = {
  id: string;
  title: string | null;
  updatedAt: Date;
};

function ConversationItem({ chat }: { chat: ChatData }) {
  const router = useRouter();
  const assistantApi = useAssistantApi();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    assistantApi.threads().switchToThread(chat.id);
    router.push(`/chat/${chat.id}`);
  };

  return (
    <Link
      href={`/chat/${chat.id}`}
      onClick={handleClick}
      className="group flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
    >
      <span className="truncate">{chat.title || "New Chat"}</span>
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
      </span>
    </Link>
  );
}

function ConversationsListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-1">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

// Reused components from thread.tsx

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-10 right-4 z-10 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const Composer: FC = () => {
  const hasUploadingAttachments = useAssistantState(({ composer }) =>
    composer.attachments.some((a) => a.status.type === "running"),
  );

  return (
    <ComposerPrimitive.Root className="w-full rounded-2xl bg-muted/50">
      <ComposerPrimitive.AttachmentDropzone className="flex w-full flex-col p-4 outline-none data-[dragging=true]:rounded-2xl data-[dragging=true]:bg-accent/30">
        <ComposerAttachments />
        <div className="flex items-center gap-3">
          <ComposerAddAttachment />
          <ComposerPrimitive.Input
            placeholder="Ask anything..."
            className="flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
            rows={1}
            autoFocus
          />
          <AssistantIf condition={({ thread }) => !thread.isRunning}>
            <ComposerPrimitive.Send asChild disabled={hasUploadingAttachments}>
              <Button
                size="icon"
                className="shrink-0 rounded-full"
                disabled={hasUploadingAttachments}
              >
                {hasUploadingAttachments ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
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
      </ComposerPrimitive.AttachmentDropzone>
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
        <div className="group/assistant relative">
          <div className="text-foreground leading-relaxed">
            <MessagePrimitive.Parts
              components={{
                Text: MarkdownText,
              }}
            />
            <MessageError />
          </div>

          <div className="absolute -bottom-1 left-0 flex translate-y-full items-center opacity-0 transition-opacity group-hover/assistant:opacity-100 data-floating:opacity-100">
            <BranchPicker />
            <AssistantActionBar />
          </div>
        </div>
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
      <ActionBarPrimitive.FeedbackPositive asChild>
        <TooltipIconButton
          tooltip="Good response"
          className="data-submitted:text-emerald-500"
        >
          <ThumbsUpIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.FeedbackPositive>
      <ActionBarPrimitive.FeedbackNegative asChild>
        <TooltipIconButton
          tooltip="Bad response"
          className="data-submitted:text-destructive"
        >
          <ThumbsDownIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.FeedbackNegative>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="fade-in slide-in-from-bottom-2 flex animate-in flex-col items-end gap-2 py-4 duration-300"
      data-role="user"
    >
      <UserMessageAttachments />
      <div className="relative max-w-[85%]">
        <div className="rounded-2xl bg-muted px-4 py-2.5 text-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
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
      className="flex items-center gap-1 text-muted-foreground"
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
        "mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
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
