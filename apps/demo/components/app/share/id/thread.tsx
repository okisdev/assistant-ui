"use client";

import { useState, useMemo, useCallback, type FC, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, FileIcon } from "lucide-react";

import { cn } from "@/lib/utils";
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
    <div className="mx-auto w-full max-w-3xl px-8 py-6">
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
    <div className="mx-auto w-full max-w-3xl px-8 py-6">
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
    <div className="inline-flex items-center text-muted-foreground text-xs">
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-6"
        onClick={onPrev}
        disabled={currentIndex === 0}
      >
        <ChevronLeftIcon className="size-3.5" />
      </Button>
      <span className="min-w-[3ch] text-center font-medium">
        {currentIndex + 1} / {totalBranches}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-6"
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
      className="fade-in slide-in-from-bottom-2 animate-in py-4 duration-300"
      data-role="assistant"
    >
      <div className="group/assistant relative">
        <div className="text-foreground leading-relaxed">
          {content.map((part, index) => (
            <MessagePartRenderer key={index} part={part} />
          ))}
        </div>

        {branchPicker && (
          <div className="mt-1 flex items-center opacity-0 transition-opacity group-hover/assistant:opacity-100">
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
      className="fade-in slide-in-from-bottom-2 flex animate-in flex-col items-end gap-2 py-4 duration-300"
      data-role="user"
    >
      {fileParts.length > 0 && (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-2">
          {fileParts.map((part, index) => (
            <UserAttachment key={index} part={part as FilePart} />
          ))}
        </div>
      )}
      {textParts.length > 0 && (
        <div className="group/user relative max-w-[85%]">
          <div className="rounded-2xl bg-muted px-4 py-2.5 text-foreground">
            {textParts.map((part, index) => (
              <MessagePartRenderer key={index} part={part} />
            ))}
          </div>
          {branchPicker && (
            <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover/user:opacity-100">
              {branchPicker}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const UserAttachment: FC<{ part: FilePart }> = ({ part }) => {
  const isImage = part.mediaType?.startsWith("image/");

  if (isImage) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <img
              src={part.url}
              alt={part.filename ?? "Attached image"}
              className="max-h-48 max-w-48 rounded-lg object-cover"
            />
          </button>
        </DialogTrigger>
        <DialogContent
          className="p-2 sm:max-w-3xl [&>button]:rounded-full [&>button]:bg-foreground/60 [&>button]:p-1 [&>button]:opacity-100 [&>button]:ring-0! [&_svg]:text-background [&>button]:hover:[&_svg]:text-destructive"
          showCloseButton
        >
          <DialogTitle className="sr-only">
            {part.filename ?? "Image preview"}
          </DialogTitle>
          <div className="relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden bg-background">
            <img
              src={part.url}
              alt={part.filename ?? "Attached image"}
              className="block h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <a
      href={part.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <FileIcon className="size-4 text-muted-foreground" />
      <span className="font-medium">{part.filename ?? "Attached file"}</span>
    </a>
  );
};

const MessagePartRenderer: FC<{ part: MessagePart }> = ({ part }) => {
  if (part.type === "text" && "text" in part) {
    return <SimpleMarkdown text={(part as TextPart).text} />;
  }

  if (part.type === "tool-call" && "toolName" in part) {
    return (
      <div className="my-2 rounded-md bg-muted/50 p-3 text-muted-foreground text-sm">
        <span className="font-medium">Tool call:</span>{" "}
        {(part as ToolCallPart).toolName}
      </div>
    );
  }

  if (part.type === "file" && "url" in part) {
    const filePart = part as FilePart;
    const isImage = filePart.mediaType?.startsWith("image/");

    if (isImage) {
      return (
        <div className="my-2">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <img
                  src={filePart.url}
                  alt={filePart.filename ?? "Attached image"}
                  className="max-h-64 rounded-lg object-contain"
                />
              </button>
            </DialogTrigger>
            <DialogContent
              className="p-2 sm:max-w-3xl [&>button]:rounded-full [&>button]:bg-foreground/60 [&>button]:p-1 [&>button]:opacity-100 [&>button]:ring-0! [&_svg]:text-background [&>button]:hover:[&_svg]:text-destructive"
              showCloseButton
            >
              <DialogTitle className="sr-only">
                {filePart.filename ?? "Image preview"}
              </DialogTitle>
              <div className="relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden bg-background">
                <img
                  src={filePart.url}
                  alt={filePart.filename ?? "Attached image"}
                  className="block h-auto max-h-[80vh] w-auto max-w-full object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return (
      <div className="my-2 inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <FileIcon className="size-4 text-muted-foreground" />
        <a
          href={filePart.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground hover:underline"
        >
          {filePart.filename ?? "Attached file"}
        </a>
      </div>
    );
  }

  return null;
};

const SimpleMarkdown: FC<{ text: string }> = ({ text }) => {
  const segments = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {segments.map((segment, index) => {
        if (segment.startsWith("```")) {
          const match = segment.match(/```(\w*)\n?([\s\S]*?)```/);
          if (match) {
            const [, language, code] = match;
            return (
              <div key={index} className="my-3">
                {language && (
                  <div className="rounded-t-lg bg-muted px-4 py-2 text-muted-foreground text-sm">
                    {language}
                  </div>
                )}
                <pre
                  className={cn(
                    "overflow-x-auto bg-[#1e1e1e] p-4 text-sm text-white",
                    language ? "rounded-b-lg" : "rounded-lg",
                  )}
                >
                  <code>{code?.trim()}</code>
                </pre>
              </div>
            );
          }
        }

        return <TextBlock key={index} text={segment} />;
      })}
    </div>
  );
};

function HeaderTag({
  level,
  children,
}: {
  level: number;
  children: ReactNode;
}) {
  const className = cn(
    level === 1 && "mb-4 font-semibold text-2xl tracking-tight",
    level === 2 && "mt-6 mb-3 font-semibold text-xl tracking-tight first:mt-0",
    level === 3 && "mt-4 mb-2 font-semibold text-lg tracking-tight first:mt-0",
    level >= 4 && "mt-4 mb-2 font-medium first:mt-0",
  );

  switch (level) {
    case 1:
      return <h1 className={className}>{children}</h1>;
    case 2:
      return <h2 className={className}>{children}</h2>;
    case 3:
      return <h3 className={className}>{children}</h3>;
    case 4:
      return <h4 className={className}>{children}</h4>;
    case 5:
      return <h5 className={className}>{children}</h5>;
    case 6:
      return <h6 className={className}>{children}</h6>;
    default:
      return <p className={className}>{children}</p>;
  }
}

const TextBlock: FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/m);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const content = headerMatch[2];
          return (
            <HeaderTag key={pIndex} level={level}>
              <InlineText text={content} />
            </HeaderTag>
          );
        }

        if (trimmed.match(/^[-*]\s/m)) {
          const items = trimmed.split(/\n/).filter((line) => line.trim());
          return (
            <ul key={pIndex} className="my-3 ml-6 list-disc [&>li]:mt-1">
              {items.map((item, iIndex) => (
                <li key={iIndex}>
                  <InlineText text={item.replace(/^[-*]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }

        if (trimmed.match(/^\d+\.\s/m)) {
          const items = trimmed.split(/\n/).filter((line) => line.trim());
          return (
            <ol key={pIndex} className="my-3 ml-6 list-decimal [&>li]:mt-1">
              {items.map((item, iIndex) => (
                <li key={iIndex}>
                  <InlineText text={item.replace(/^\d+\.\s+/, "")} />
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={pIndex} className="my-3 leading-7 first:mt-0 last:mb-0">
            <InlineText text={trimmed} />
          </p>
        );
      })}
    </>
  );
};

const InlineText: FC<{ text: string }> = ({ text }) => {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index));
      }
      parts.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    const italicMatch = remaining.match(/\*([^*]+)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.slice(0, italicMatch.index));
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch.index !== undefined) {
      if (linkMatch.index > 0) {
        parts.push(remaining.slice(0, linkMatch.index));
      }
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          className="font-medium text-foreground underline underline-offset-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
      continue;
    }

    parts.push(remaining);
    break;
  }

  return <>{parts}</>;
};

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
          if (typeof part === "object" && part && "type" in part) {
            return part as MessagePart;
          }
          return { type: "unknown" };
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
