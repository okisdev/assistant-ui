"use client";

import { type FC, useMemo, useState, useSyncExternalStore } from "react";
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
  AudioLinesIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  GlobeIcon,
  ImageIcon,
  LoaderIcon,
  PencilIcon,
  RefreshCwIcon,
  Share2Icon,
  StopCircleIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { toast } from "sonner";

import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { MCPAppToolFallback } from "@/components/assistant-ui/mcp-app-tool-ui";
import { ReasoningContent } from "@/components/assistant-ui/reasoning-content";
import { SourceContent } from "@/components/assistant-ui/source-content";
import { TextWithChainOfThought } from "@/components/assistant-ui/text-with-chain-of-thought";
import { useCapabilities } from "@/contexts/capabilities-provider";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { UserMessageAttachments } from "@/components/assistant-ui/attachment";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/ai/utils";
import { hasChainOfThought } from "@/lib/ai/parse-chain-of-thought";
import { api } from "@/utils/trpc/client";
import { modelTransport } from "@/app/(app)/(chat)/provider";
import type { MessageTiming } from "@/lib/types/timing";

export const ThreadScrollToBottom: FC = () => {
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

export const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="mt-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
        <ErrorPrimitive.Message className="line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

type WebSearchAction = {
  type: "search" | "openPage";
  query?: string;
  url?: string;
};

type WebSearchResult = {
  action?: WebSearchAction;
  sources?: Array<{ type: string; url: string }>;
};

type ProgressItem =
  | { type: "reasoning"; id: string; hasContent: boolean }
  | { type: "chain_of_thought"; id: string; hasContent: boolean }
  | {
      type: "web_search";
      id: string;
      completed: boolean;
      action?: WebSearchAction;
      sourcesCount: number;
    }
  | {
      type: "generate_image";
      id: string;
      completed: boolean;
    }
  | {
      type: "mcp_tool";
      id: string;
      toolName: string;
      completed: boolean;
    }
  | {
      type: "app_tool";
      id: string;
      toolName: string;
      completed: boolean;
    };

function useMessageTiming(messageId: string): MessageTiming | undefined {
  return useSyncExternalStore(
    (callback) => modelTransport.subscribeToTimings(callback),
    () => modelTransport.getTimingForMessage(messageId),
    () => undefined,
  );
}

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const ActivityProgress: FC<{ isRunning: boolean; cotEnabled?: boolean }> = ({
  isRunning,
  cotEnabled = false,
}) => {
  const parts = useAssistantState(({ message }) => message.parts);

  const items = useMemo(() => {
    const result: ProgressItem[] = [];

    for (const part of parts) {
      if (part.type === "reasoning") {
        const hasContent =
          "text" in part &&
          typeof part.text === "string" &&
          part.text.length > 0;
        result.push({
          type: "reasoning",
          id: "id" in part ? String(part.id) : `reasoning-${result.length}`,
          hasContent,
        });
      }

      // Check for chain of thought in text content (from prompt-based CoT)
      if (part.type === "text" && cotEnabled) {
        const text =
          "text" in part && typeof part.text === "string" ? part.text : "";
        if (hasChainOfThought(text)) {
          // Check if thinking is still in progress (no closing tag yet)
          const isThinkingInProgress =
            text.includes("<thinking>") && !text.includes("</thinking>");
          result.push({
            type: "chain_of_thought",
            id: `cot-${result.length}`,
            hasContent: !isThinkingInProgress,
          });
        }
      }

      if (part.type === "tool-call" && part.toolName === "web_search") {
        const webResult = part.result as WebSearchResult | undefined;
        result.push({
          type: "web_search",
          id: part.toolCallId,
          completed: !!webResult,
          action: webResult?.action,
          sourcesCount: webResult?.sources?.length ?? 0,
        });
      }

      if (part.type === "tool-call" && part.toolName === "generate_image") {
        result.push({
          type: "generate_image",
          id: part.toolCallId,
          completed: !!part.result,
        });
      }

      if (
        part.type === "tool-call" &&
        part.toolName.startsWith("mcp_") &&
        part.toolName !== "web_search" &&
        part.toolName !== "generate_image"
      ) {
        result.push({
          type: "mcp_tool",
          id: part.toolCallId,
          toolName: part.toolName,
          completed: !!part.result,
        });
      }

      // App tools (all start with app_)
      if (part.type === "tool-call" && part.toolName.startsWith("app_")) {
        result.push({
          type: "app_tool",
          id: part.toolCallId,
          toolName: part.toolName,
          completed: !!part.result,
        });
      }
    }

    return result;
  }, [parts, cotEnabled]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-1.5">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (item.type === "reasoning") {
          if (!item.hasContent) {
            if (isRunning && isLast) {
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <LoaderIcon className="size-4 animate-spin" />
                  <span className="shimmer text-sm">Thinking...</span>
                </div>
              );
            }
            return null;
          }
          return null;
        }

        if (item.type === "chain_of_thought") {
          if (!item.hasContent && isRunning) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 text-amber-600 dark:text-amber-500"
              >
                <LoaderIcon className="size-4 animate-spin" />
                <span className="shimmer text-sm">
                  Reasoning step by step...
                </span>
              </div>
            );
          }
          return null;
        }

        if (item.type === "web_search") {
          if (!item.completed) {
            if (isRunning) {
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <GlobeIcon className="size-4 animate-pulse" />
                  <span className="shimmer text-sm">Searching the web...</span>
                </div>
              );
            }
            return null;
          }

          const { action, sourcesCount } = item;
          let label: React.ReactNode = null;

          if (action?.type === "search" && action.query) {
            label = (
              <>
                Searched:{" "}
                <span className="font-medium text-foreground/80">
                  &quot;{action.query}&quot;
                </span>
                {sourcesCount > 0 && (
                  <span className="text-muted-foreground/70">
                    {" "}
                    · {sourcesCount} sources
                  </span>
                )}
              </>
            );
          } else if (action?.type === "openPage" && action.url) {
            label = (
              <>
                Visited:{" "}
                <span className="font-medium text-foreground/80">
                  {getHostname(action.url)}
                </span>
              </>
            );
          }

          if (!label) return null;

          return (
            <div
              key={item.id}
              className="flex items-start gap-2 text-muted-foreground text-xs"
            >
              <CheckIcon className="mt-0.5 size-3 shrink-0 text-emerald-500" />
              <span>{label}</span>
            </div>
          );
        }

        if (item.type === "generate_image") {
          if (!item.completed && isRunning) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <ImageIcon className="size-4 animate-pulse" />
                <span className="shimmer text-sm">Generating image...</span>
              </div>
            );
          }
          return null;
        }

        if (item.type === "mcp_tool") {
          const toolParts = item.toolName.replace(/^mcp_/, "").split("_");
          const serverName = toolParts[0] || "MCP";
          const toolNameDisplay = toolParts.slice(1).join("_") || item.toolName;

          if (!item.completed && isRunning) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
              >
                <LoaderIcon className="size-4 animate-spin" />
                <span className="shimmer text-sm">
                  Using {serverName}: {toolNameDisplay}...
                </span>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="flex items-start gap-2 text-muted-foreground text-xs"
            >
              <CheckIcon className="mt-0.5 size-3 shrink-0 text-emerald-500" />
              <span>
                Used {serverName}:{" "}
                <span className="font-medium text-foreground/80">
                  {toolNameDisplay}
                </span>
              </span>
            </div>
          );
        }

        if (item.type === "app_tool") {
          const toolParts = item.toolName.replace(/^app_/, "").split("_");
          const appName = toolParts.slice(0, 2).join("_") || "app";
          const toolNameDisplay = toolParts.slice(2).join("_") || item.toolName;

          if (!item.completed && isRunning) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 text-violet-600 dark:text-violet-400"
              >
                <LoaderIcon className="size-4 animate-spin" />
                <span className="shimmer text-sm">
                  Using {appName}: {toolNameDisplay}...
                </span>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="flex items-start gap-2 text-muted-foreground text-xs"
            >
              <CheckIcon className="mt-0.5 size-3 shrink-0 text-emerald-500" />
              <span>
                Used {appName}:{" "}
                <span className="font-medium text-foreground/80">
                  {toolNameDisplay}
                </span>
              </span>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export const AssistantMessage: FC = () => {
  const { capabilities } = useCapabilities();
  const isRunning = useAssistantState(
    ({ message }) => message.status?.type === "running",
  );

  const hasTextContent = useAssistantState(({ message }) =>
    message.parts.some((part) => part.type === "text" && part.text.length > 0),
  );

  const hasReasoningContent = useAssistantState(({ message }) =>
    message.parts.some(
      (part) =>
        part.type === "reasoning" &&
        "text" in part &&
        typeof part.text === "string" &&
        part.text.length > 0,
    ),
  );

  const cotMode = capabilities.prompting.chainOfThought;

  const hasActivityParts = useAssistantState(({ message }) =>
    message.parts.some(
      (part) =>
        part.type === "reasoning" ||
        (part.type === "tool-call" &&
          (part.toolName === "web_search" ||
            part.toolName === "generate_image" ||
            part.toolName === "create_artifact" ||
            part.toolName === "save_memory" ||
            part.toolName.startsWith("mcp_") ||
            part.toolName.startsWith("app_"))),
    ),
  );

  const hasChainOfThoughtInProgress = useAssistantState(({ message }) => {
    if (cotMode === "off") return false;
    return message.parts.some(
      (part) =>
        part.type === "text" &&
        "text" in part &&
        typeof part.text === "string" &&
        hasChainOfThought(part.text) &&
        !part.text.includes("</thinking>"),
    );
  });

  const showActivityProgress = hasActivityParts || hasChainOfThoughtInProgress;

  const hasSources = useAssistantState(({ message }) => {
    if (message.status?.type === "running") return false;
    return message.parts.some((part) => {
      if (part.type === "source") return true;
      if (
        part.type === "tool-call" &&
        part.toolName === "web_search" &&
        part.result
      ) {
        const result = part.result as {
          sources?: Array<{ type: string; url: string }>;
        };
        return result.sources && result.sources.length > 0;
      }
      return false;
    });
  });

  const isLoading =
    isRunning &&
    !hasTextContent &&
    !hasReasoningContent &&
    !showActivityProgress;

  const useCotTextComponent = cotMode !== "off" && !hasReasoningContent;
  const TextComponent = useCotTextComponent
    ? TextWithChainOfThought
    : MarkdownText;

  return (
    <MessagePrimitive.Root
      className="fade-in slide-in-from-bottom-2 animate-in py-4 duration-300"
      data-role="assistant"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoaderIcon className="size-4 animate-spin" />
          <span className="shimmer text-sm">Thinking...</span>
        </div>
      ) : (
        <div className="group/assistant relative">
          {showActivityProgress && (
            <ActivityProgress
              isRunning={isRunning}
              cotEnabled={cotMode !== "off"}
            />
          )}

          <div className="text-foreground leading-relaxed">
            <MessagePrimitive.Parts
              components={{
                Text: TextComponent,
                Reasoning: ReasoningContent,
                Source: () => null,
                tools: {
                  Fallback: MCPAppToolFallback,
                },
              }}
            />
            <MessageError />
          </div>

          {hasSources && <SourcesDisplay />}

          <div className="absolute -bottom-2 left-0 flex translate-y-full items-center opacity-0 transition-opacity group-hover/assistant:opacity-100 data-floating:opacity-100">
            <BranchPicker />
            <AssistantActionBar />
          </div>
        </div>
      )}
    </MessagePrimitive.Root>
  );
};

type ExtractedSource = {
  id: string;
  url: string;
  title?: string;
};

type MessagePart = {
  type: string;
  id?: string;
  url?: string;
  title?: string;
  toolName?: string;
  toolCallId?: string;
  result?: unknown;
};

const extractSources = (parts: readonly MessagePart[]): ExtractedSource[] => {
  const extracted: ExtractedSource[] = [];
  const seenUrls = new Set<string>();

  for (const part of parts) {
    if (part.type === "source" && part.url && part.id) {
      if (!seenUrls.has(part.url)) {
        seenUrls.add(part.url);
        extracted.push({
          id: part.id,
          url: part.url,
          title: part.title,
        });
      }
    }

    if (
      part.type === "tool-call" &&
      part.toolName === "web_search" &&
      part.result &&
      part.toolCallId
    ) {
      const result = part.result as {
        sources?: Array<{ type: string; url: string; title?: string }>;
      };
      if (result.sources) {
        for (const source of result.sources) {
          if (
            source.type === "url" &&
            source.url &&
            !seenUrls.has(source.url)
          ) {
            seenUrls.add(source.url);
            extracted.push({
              id: `${part.toolCallId}-${source.url}`,
              url: source.url,
              title: source.title,
            });
          }
        }
      }
    }
  }

  return extracted;
};

const COLLAPSED_SOURCES_COUNT = 3;

const MessageTimingDisplay: FC = () => {
  const messageId = useAssistantState(({ message }) => message.id);
  const timing = useMessageTiming(messageId);

  if (!timing || timing.totalStreamTime === undefined) return null;

  const totalTimeText = formatTime(timing.totalStreamTime);
  if (!totalTimeText) return null;

  return (
    <div className="group/timing relative flex items-center">
      <button
        type="button"
        className="flex h-6 items-center justify-center rounded-md px-1.5 font-mono text-muted-foreground text-xs tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {totalTimeText}
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 scale-95 rounded-lg bg-popover px-3 py-2 opacity-0 shadow-lg transition-all group-hover/timing:pointer-events-auto group-hover/timing:scale-100 group-hover/timing:opacity-100">
        <div className="grid min-w-[140px] gap-1.5 text-xs">
          {timing.timeToFirstChunk !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">First chunk</span>
              <span className="font-mono text-foreground tabular-nums">
                {formatTime(timing.timeToFirstChunk)}
              </span>
            </div>
          )}
          {timing.timeToFirstToken !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">First token</span>
              <span className="font-mono text-foreground tabular-nums">
                {formatTime(timing.timeToFirstToken)}
              </span>
            </div>
          )}
          {timing.totalStreamTime !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono text-foreground tabular-nums">
                {formatTime(timing.totalStreamTime)}
              </span>
            </div>
          )}
          {timing.tokensPerSecond !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Speed</span>
              <span className="font-mono text-foreground tabular-nums">
                {timing.tokensPerSecond.toFixed(1)} tok/s
              </span>
            </div>
          )}
          {timing.totalChunks !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Chunks</span>
              <span className="font-mono text-foreground tabular-nums">
                {timing.totalChunks}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SourcesDisplay: FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const parts = useAssistantState(({ message }) => message.parts);
  const sources = useMemo(
    () => extractSources(parts as readonly MessagePart[]),
    [parts],
  );

  if (sources.length === 0) return null;

  const hasMore = sources.length > COLLAPSED_SOURCES_COUNT;
  const visibleSources = isExpanded
    ? sources
    : sources.slice(0, COLLAPSED_SOURCES_COUNT);
  const hiddenCount = sources.length - COLLAPSED_SOURCES_COUNT;

  return (
    <div className="mt-3">
      <div
        className={cn(
          "flex gap-1.5",
          isExpanded ? "flex-wrap" : "flex-nowrap overflow-hidden",
        )}
      >
        {visibleSources.map((source) => (
          <SourceContent
            key={source.id}
            type="source"
            sourceType="url"
            id={source.id}
            url={source.url}
            title={source.title}
            status={{ type: "complete" }}
          />
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronDownIcon className="size-3 rotate-180" />
                Less
              </>
            ) : (
              `+${hiddenCount} more`
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const MessageShareButton: FC = () => {
  const chatId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );
  const messageId = useAssistantState(({ message }) => message.id);

  const createShareMutation = api.share.create.useMutation({
    onError: () => {
      toast.error("Failed to create link");
    },
  });

  if (!chatId || !messageId) return null;

  const handleShare = async () => {
    try {
      const result = await createShareMutation.mutateAsync({
        resourceType: "message",
        resourceId: chatId,
        messageId,
        isPublic: true,
      });
      const url = `${window.location.origin}/share/${result.id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {}
  };

  return (
    <TooltipIconButton
      tooltip="Share"
      onClick={handleShare}
      disabled={createShareMutation.isPending}
    >
      {createShareMutation.isPending ? (
        <LoaderIcon className="animate-spin" />
      ) : (
        <Share2Icon />
      )}
    </TooltipIconButton>
  );
};

export const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="-ml-1 flex gap-1 text-muted-foreground"
    >
      <AssistantIf condition={({ message }) => message.speech == null}>
        <ActionBarPrimitive.Speak asChild>
          <TooltipIconButton tooltip="Read aloud">
            <AudioLinesIcon />
          </TooltipIconButton>
        </ActionBarPrimitive.Speak>
      </AssistantIf>
      <AssistantIf condition={({ message }) => message.speech != null}>
        <ActionBarPrimitive.StopSpeaking asChild>
          <TooltipIconButton tooltip="Stop reading">
            <StopCircleIcon />
          </TooltipIconButton>
        </ActionBarPrimitive.StopSpeaking>
      </AssistantIf>
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
      <MessageShareButton />
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
      <MessageTimingDisplay />
    </ActionBarPrimitive.Root>
  );
};

export const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="fade-in slide-in-from-bottom-2 flex animate-in flex-col items-end gap-2 py-4 duration-300"
      data-role="user"
    >
      <UserMessageAttachments />
      <div className="group/user relative max-w-[85%]">
        <div className="rounded-2xl bg-muted px-4 py-2.5 text-foreground">
          <MessagePrimitive.Parts />
        </div>
        <div className="absolute right-0 -bottom-2 flex translate-y-full items-center opacity-0 transition-opacity group-hover/user:opacity-100 data-floating:opacity-100">
          <BranchPicker />
          <UserActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

export const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="-mr-1 flex gap-1 text-muted-foreground"
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

export const EditComposer: FC = () => {
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

export const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
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
