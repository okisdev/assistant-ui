"use client";

import {
  unstable_createMessageConverter,
  getExternalStoreMessages,
  type ReasoningMessagePart,
  type ToolCallMessagePart,
  type TextMessagePart,
  type ImageMessagePart,
  type FileMessagePart,
  type useExternalMessageConverter,
  type ToolExecutionStatus,
  type ThreadMessage,
} from "@assistant-ui/react";
import type {
  TanStackUIMessage,
  TanStackMessagePart,
  TanStackToolCallState,
} from "./types";
import {
  parsePartialJsonObject,
  type ReadonlyJSONObject,
} from "assistant-stream/utils";

type ConversionMetadata = useExternalMessageConverter.Metadata & {
  toolStatuses?: Record<string, ToolExecutionStatus>;
};

/**
 * Determine if a tool call needs an interrupt based on state and approval
 */
const getToolCallInterrupt = (
  state: TanStackToolCallState,
  approval:
    | { approved?: boolean; id: string; needsApproval: boolean }
    | undefined,
  toolStatus?: ToolExecutionStatus,
): { type: "human"; payload: unknown } | undefined => {
  if (toolStatus?.type === "interrupt") {
    return { type: "human", payload: toolStatus.payload };
  }

  if (state === "approval-requested" || approval?.needsApproval) {
    return { type: "human", payload: { needsApproval: true } };
  }

  return undefined;
};

/**
 * Convert TanStack AI message parts to assistant-ui content parts
 */
const convertParts = (
  parts: TanStackMessagePart[],
  metadata: ConversionMetadata,
): Array<
  | TextMessagePart
  | ReasoningMessagePart
  | ToolCallMessagePart
  | ImageMessagePart
  | FileMessagePart
> => {
  return parts
    .map((part) => {
      const type = part.type;

      switch (type) {
        case "text":
          return {
            type: "text",
            text: part.content,
          } satisfies TextMessagePart;

        case "thinking":
          return {
            type: "reasoning",
            text: part.content,
          } satisfies ReasoningMessagePart;

        case "tool-call": {
          const toolCallId = part.id;
          const toolName = part.name;
          const argsText = part.arguments;
          const toolStatus = metadata.toolStatuses?.[toolCallId];

          // Parse arguments - handle streaming case where JSON might be incomplete
          let args: ReadonlyJSONObject = {};
          try {
            args = argsText ? (parsePartialJsonObject(argsText) ?? {}) : {};
          } catch {
            args = {};
          }

          const interrupt = getToolCallInterrupt(
            part.state,
            part.approval,
            toolStatus,
          );

          return {
            type: "tool-call",
            toolCallId,
            toolName,
            argsText,
            args,
            result: part.output,
            isError: part.state === "output-error",
            ...(interrupt && { interrupt }),
          } satisfies ToolCallMessagePart;
        }

        case "tool-result":
          // Tool results are handled as part of tool-call parts
          return null;

        case "image":
          return {
            type: "image",
            image:
              part.source.type === "url"
                ? part.source.value
                : `data:image/*;base64,${part.source.value}`,
          } satisfies ImageMessagePart;

        case "audio":
          return {
            type: "file",
            data:
              part.source.type === "url"
                ? part.source.value
                : `data:audio/*;base64,${part.source.value}`,
            mimeType: "audio/*",
          } satisfies FileMessagePart;

        case "video":
          return {
            type: "file",
            data:
              part.source.type === "url"
                ? part.source.value
                : `data:video/*;base64,${part.source.value}`,
            mimeType: "video/*",
          } satisfies FileMessagePart;

        case "document":
          return {
            type: "file",
            data:
              part.source.type === "url"
                ? part.source.value
                : `data:application/pdf;base64,${part.source.value}`,
            mimeType: "application/pdf",
          } satisfies FileMessagePart;

        default: {
          const _exhaustiveCheck: never = type;
          console.warn(
            `Unsupported TanStack AI message part type: ${_exhaustiveCheck}`,
          );
          return null;
        }
      }
    })
    .filter(Boolean) as Array<
    | TextMessagePart
    | ReasoningMessagePart
    | ToolCallMessagePart
    | ImageMessagePart
    | FileMessagePart
  >;
};

/**
 * Message converter for TanStack AI UIMessage to assistant-ui ThreadMessage
 */
export const TanStackMessageConverter = unstable_createMessageConverter(
  (message: TanStackUIMessage, metadata: ConversionMetadata) => {
    const createdAt = message.createdAt ?? new Date();

    switch (message.role) {
      case "user":
        return {
          role: "user",
          id: message.id,
          createdAt,
          content: convertParts(message.parts, metadata),
        };

      case "system":
        return {
          role: "system",
          id: message.id,
          createdAt,
          content: convertParts(message.parts, metadata),
        };

      case "assistant":
        return {
          role: "assistant",
          id: message.id,
          createdAt,
          content: convertParts(message.parts, metadata),
          metadata: {
            custom: {},
          },
        };

      default: {
        const _exhaustiveCheck: never = message.role;
        console.warn(`Unsupported message role: ${_exhaustiveCheck}`);
        return [];
      }
    }
  },
);

/**
 * Get the original TanStack AI messages from a ThreadMessage
 */
export const getTanStackMessages = <T extends TanStackUIMessage>(
  message: ThreadMessage,
): T[] => {
  return getExternalStoreMessages(message) as T[];
};
