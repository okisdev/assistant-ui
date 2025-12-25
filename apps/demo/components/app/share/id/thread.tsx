"use client";

import { useState, useMemo, useCallback, type FC, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, FileIcon } from "lucide-react";

import { SimpleMarkdown } from "./simple-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TextPart = {
  type: "text";
  text: string;
};

type ToolCallPart = {
  type: "tool-call";
  toolName?: string;
  toolCallId?: string;
  result?: unknown;
};

type FilePart = {
  type: "file";
  url: string;
  mediaType: string;
  filename?: string;
};

type MessagePart = TextPart | ToolCallPart | FilePart | { type: string };

type MessageContent = MessagePart[];

export type SharedMessage = {
  id: string;
  parentId: string | null;
  role: string | null;
  format: string;
  content: unknown;
  createdAt: Date;
};

type SharedThreadProps = {
  messages: SharedMessage[];
};

type MessageNode = SharedMessage & {
  children: MessageNode[];
};

function buildMessageTree(messages: SharedMessage[]): {
  roots: MessageNode[];
  nodeMap: Map<string, MessageNode>;
} {
  const nodeMap = new Map<string, MessageNode>();
  const roots: MessageNode[] = [];

  for (const msg of messages) {
    nodeMap.set(msg.id, { ...msg, children: [] });
  }

  for (const msg of messages) {
    const node = nodeMap.get(msg.id)!;
    if (msg.parentId && nodeMap.has(msg.parentId)) {
      const parent = nodeMap.get(msg.parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const node of nodeMap.values()) {
    node.children.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  return { roots, nodeMap };
}

function getMessageRole(message: SharedMessage): string | null {
  if (message.role) {
    return message.role;
  }

  if (
    message.format === "ai-sdk/v5" &&
    message.content &&
    typeof message.content === "object" &&
    "role" in message.content
  ) {
    return (message.content as { role: string }).role;
  }

  return null;
}

type BranchSelections = Map<string, number>;

function getLinearPath(
  roots: MessageNode[],
  selections: BranchSelections,
): MessageNode[] {
  const path: MessageNode[] = [];

  const rootIndex: number = selections.get("root") ?? 0;
  let current: MessageNode | undefined = roots[rootIndex] ?? roots[0];

  while (current) {
    path.push(current);

    if (current.children.length === 0) {
      break;
    }

    const childIndex: number = selections.get(current.id) ?? 0;
    current = current.children[childIndex];
  }

  return path;
}

type SharedSingleMessageProps = {
  message: SharedMessage;
};

export const SharedSingleMessage: FC<SharedSingleMessageProps> = ({
  message,
}) => {
  const role = getMessageRole(message);
  const content = parseContent(message);

  if (role !== "assistant") {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Invalid message type
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div
        className="fade-in slide-in-from-bottom-2 animate-in py-4 duration-300"
        data-role="assistant"
      >
        <div className="text-foreground leading-relaxed">
          {content.map((part, index) => (
            <MessagePartRenderer key={index} part={part} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SharedThread: FC<SharedThreadProps> = ({ messages }) => {
  const [branchSelections, setBranchSelections] = useState<BranchSelections>(
    new Map(),
  );

  const { roots, nodeMap } = useMemo(
    () => buildMessageTree(messages),
    [messages],
  );

  const currentPath = useMemo(
    () => getLinearPath(roots, branchSelections),
    [roots, branchSelections],
  );

  const handleBranchChange = useCallback(
    (parentId: string | null, newIndex: number) => {
      setBranchSelections((prev) => {
        const next = new Map(prev);
        next.set(parentId ?? "root", newIndex);
        return next;
      });
    },
    [],
  );

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        No messages in this conversation
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      {currentPath.map((node) => {
        const role = getMessageRole(node);
        const parentId = node.parentId;
        let siblings: MessageNode[] = [];

        if (parentId === null) {
          siblings = roots;
        } else {
          const parentNode = nodeMap.get(parentId);
          if (parentNode) {
            siblings = parentNode.children;
          }
        }

        const hasBranches = siblings.length > 1;
        const currentBranchIndex = siblings.findIndex((s) => s.id === node.id);

        const branchPicker = hasBranches ? (
          <BranchPicker
            key={`branch-${node.id}`}
            currentIndex={currentBranchIndex}
            totalBranches={siblings.length}
            onPrev={() => handleBranchChange(parentId, currentBranchIndex - 1)}
            onNext={() => handleBranchChange(parentId, currentBranchIndex + 1)}
          />
        ) : null;

        if (role === "user") {
          return (
            <UserMessage
              key={node.id}
              message={node}
              branchPicker={branchPicker}
            />
          );
        }
        if (role === "assistant") {
          return (
            <AssistantMessage
              key={node.id}
              message={node}
              branchPicker={branchPicker}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

type BranchPickerProps = {
  currentIndex: number;
  totalBranches: number;
  onPrev: () => void;
  onNext: () => void;
};

const BranchPicker: FC<BranchPickerProps> = ({
  currentIndex,
  totalBranches,
  onPrev,
  onNext,
}) => {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-muted/50 px-1 text-muted-foreground">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-full hover:bg-muted"
        onClick={onPrev}
        disabled={currentIndex === 0}
      >
        <ChevronLeftIcon className="size-3.5" />
      </Button>
      <span className="min-w-[3ch] text-center text-xs tabular-nums">
        {currentIndex + 1}/{totalBranches}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 rounded-full hover:bg-muted"
        onClick={onNext}
        disabled={currentIndex === totalBranches - 1}
      >
        <ChevronRightIcon className="size-3.5" />
      </Button>
    </div>
  );
};

type MessageProps = {
  message: SharedMessage;
  branchPicker: ReactNode;
};

const AssistantMessage: FC<MessageProps> = ({ message, branchPicker }) => {
  const content = parseContent(message);

  return (
    <div
      className="fade-in slide-in-from-bottom-2 animate-in duration-300"
      data-role="assistant"
    >
      <div className="group/assistant relative">
        <div className="text-foreground leading-relaxed">
          {content.map((part, index) => (
            <MessagePartRenderer key={index} part={part} />
          ))}
        </div>

        {branchPicker && (
          <div className="mt-2 flex items-center opacity-0 transition-opacity group-hover/assistant:opacity-100">
            {branchPicker}
          </div>
        )}
      </div>
    </div>
  );
};

const UserMessage: FC<MessageProps> = ({ message, branchPicker }) => {
  const content = parseContent(message);
  const fileParts = content.filter((part) => part.type === "file");
  const textParts = content.filter((part) => part.type !== "file");

  return (
    <div
      className="fade-in slide-in-from-bottom-2 flex animate-in flex-col items-end gap-2.5 py-1 duration-300"
      data-role="user"
    >
      {fileParts.length > 0 && (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-2.5">
          {fileParts.map((part, index) => (
            <UserAttachment key={index} part={part as FilePart} />
          ))}
        </div>
      )}
      {textParts.length > 0 && (
        <div className="group/user relative max-w-[85%]">
          <div className="rounded-2xl bg-muted/50 px-4 py-3 text-foreground">
            {textParts.map((part, index) => (
              <MessagePartRenderer key={index} part={part} />
            ))}
          </div>
          {branchPicker && (
            <div className="mt-2 flex justify-end opacity-0 transition-opacity group-hover/user:opacity-100">
              {branchPicker}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ImagePreviewDialog: FC<{
  src: string;
  alt: string;
  children: ReactNode;
}> = ({ src, alt, children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="rounded-2xl p-2 sm:max-w-3xl [&>button]:rounded-full [&>button]:bg-foreground/60 [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:ring-0! [&_svg]:text-background [&>button]:hover:[&_svg]:text-destructive"
        showCloseButton
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden rounded-xl bg-background">
          <img
            src={src}
            alt={alt}
            className="block h-auto max-h-[80vh] w-auto max-w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UserAttachment: FC<{ part: FilePart }> = ({ part }) => {
  const isImage = part.mediaType?.startsWith("image/");

  if (isImage) {
    return (
      <ImagePreviewDialog
        src={part.url}
        alt={part.filename ?? "Attached image"}
      >
        <button
          type="button"
          className="cursor-pointer overflow-hidden rounded-xl transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={part.url}
            alt={part.filename ?? "Attached image"}
            className="max-h-40 max-w-40 rounded-xl object-cover"
          />
        </button>
      </ImagePreviewDialog>
    );
  }

  return (
    <a
      href={part.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-[13px] transition-colors hover:bg-muted"
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-background/80">
        <FileIcon className="size-4 text-muted-foreground" />
      </div>
      <span className="font-medium">{part.filename ?? "Attached file"}</span>
    </a>
  );
};

const MessagePartRenderer: FC<{ part: MessagePart }> = ({ part }) => {
  if (part.type === "text" && "text" in part) {
    return <SimpleMarkdown text={(part as TextPart).text} />;
  }

  if (part.type === "tool-call" && "toolName" in part) {
    const toolCallPart = part as ToolCallPart;

    if (toolCallPart.toolName === "generate_image" && toolCallPart.result) {
      const result = toolCallPart.result as {
        url?: string;
        prompt?: string;
      };
      if (result.url) {
        return (
          <div className="my-3">
            <ImagePreviewDialog
              src={result.url}
              alt={result.prompt ?? "Generated image"}
            >
              <button
                type="button"
                className="cursor-pointer overflow-hidden rounded-xl transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={result.url}
                  alt={result.prompt ?? "Generated image"}
                  className="max-h-72 rounded-xl object-contain"
                />
              </button>
            </ImagePreviewDialog>
            {result.prompt && (
              <p className="mt-2.5 line-clamp-2 text-muted-foreground text-xs">
                {result.prompt}
              </p>
            )}
          </div>
        );
      }
    }

    return (
      <div className="my-3 rounded-xl bg-muted/50 px-4 py-3 text-[13px] text-muted-foreground">
        <span className="font-medium">Tool call:</span> {toolCallPart.toolName}
      </div>
    );
  }

  if (part.type === "file" && "url" in part) {
    const filePart = part as FilePart;
    const isImage = filePart.mediaType?.startsWith("image/");

    if (isImage) {
      return (
        <div className="my-3">
          <ImagePreviewDialog
            src={filePart.url}
            alt={filePart.filename ?? "Attached image"}
          >
            <button
              type="button"
              className="cursor-pointer overflow-hidden rounded-xl transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={filePart.url}
                alt={filePart.filename ?? "Attached image"}
                className="max-h-72 rounded-xl object-contain"
              />
            </button>
          </ImagePreviewDialog>
        </div>
      );
    }

    return (
      <div className="my-3">
        <a
          href={filePart.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-[13px] transition-colors hover:bg-muted"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-background/80">
            <FileIcon className="size-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground">
            {filePart.filename ?? "Attached file"}
          </span>
        </a>
      </div>
    );
  }

  return null;
};

type AISDKToolPart = {
  type: string;
  toolCallId?: string;
  state?:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function isAISDKToolPart(part: unknown): part is AISDKToolPart {
  if (typeof part !== "object" || part === null || !("type" in part)) {
    return false;
  }
  const p = part as { type: string };
  return p.type.startsWith("tool-") || p.type === "dynamic-tool";
}

function parseContent(message: SharedMessage): MessageContent {
  const content = message.content;
  if (!content) return [];

  if (
    message.format === "ai-sdk/v5" &&
    typeof content === "object" &&
    "parts" in content
  ) {
    const parts = (content as { parts: unknown[] }).parts;
    if (Array.isArray(parts)) {
      return parts
        .filter((part) => {
          if (typeof part === "object" && part && "type" in part) {
            return part.type !== "step-start";
          }
          return true;
        })
        .map((part) => {
          if (typeof part !== "object" || part === null || !("type" in part)) {
            return { type: "unknown" };
          }

          if (isAISDKToolPart(part)) {
            const p = part as AISDKToolPart;
            const toolName =
              p.type === "dynamic-tool"
                ? ((part as { toolName?: string }).toolName ?? "unknown")
                : p.type.replace("tool-", "");

            const result =
              p.state === "output-available" ? p.output : undefined;

            return {
              type: "tool-call",
              toolName,
              toolCallId: p.toolCallId,
              result,
            } as ToolCallPart;
          }

          return part as MessagePart;
        });
    }
  }

  if (Array.isArray(content)) {
    return content as MessageContent;
  }

  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }

  return [];
}
