import type { ThreadMessage, MessageStatus } from "@assistant-ui/react";
import type {
  ReadonlyJSONObject,
  ReadonlyJSONValue,
} from "assistant-stream/utils";

type AuiV0MessageMessagePart =
  | {
      readonly type: "text";
      readonly text: string;
    }
  | {
      readonly type: "reasoning";
      readonly text: string;
    }
  | {
      readonly type: "source";
      readonly sourceType: "url";
      readonly id: string;
      readonly url: string;
      readonly title?: string;
    }
  | {
      readonly type: "tool-call";
      readonly toolCallId: string;
      readonly toolName: string;
      readonly args: ReadonlyJSONObject;
      readonly result?: ReadonlyJSONValue;
      readonly isError?: true;
    }
  | {
      readonly type: "tool-call";
      readonly toolCallId: string;
      readonly toolName: string;
      readonly argsText: string;
      readonly result?: ReadonlyJSONValue;
      readonly isError?: true;
    };

type AuiV0Message = {
  readonly role: "assistant" | "user" | "system";
  readonly status?: MessageStatus;
  readonly content: readonly AuiV0MessageMessagePart[];
  readonly metadata: {
    readonly unstable_state?: ReadonlyJSONValue;
    readonly unstable_annotations: readonly ReadonlyJSONValue[];
    readonly unstable_data: readonly ReadonlyJSONValue[];
    readonly steps: readonly {
      readonly usage?: {
        readonly promptTokens: number;
        readonly completionTokens: number;
      };
    }[];
    readonly custom: ReadonlyJSONObject;
  };
};

function isJSONValue(value: unknown): value is ReadonlyJSONValue {
  if (value === null) return true;
  if (typeof value === "string") return true;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.every(isJSONValue);
  if (typeof value === "object") {
    return Object.values(value).every(isJSONValue);
  }
  return false;
}

export const auiV0Encode = (message: ThreadMessage): AuiV0Message => {
  return {
    role: message.role,
    content: message.content.map((part) => {
      const type = part.type;
      switch (type) {
        case "text": {
          return {
            type: "text" as const,
            text: part.text,
          };
        }

        case "reasoning": {
          return {
            type: "reasoning" as const,
            text: part.text,
          };
        }

        case "source": {
          return {
            type: "source" as const,
            sourceType: part.sourceType,
            id: part.id,
            url: part.url,
            ...(part.title ? { title: part.title } : undefined),
          };
        }

        case "tool-call": {
          if (!isJSONValue(part.result)) {
            console.warn(
              `tool-call result is not JSON! ${JSON.stringify(part)}`,
            );
          }
          return {
            type: "tool-call" as const,
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            ...(JSON.stringify(part.args) === part.argsText
              ? {
                  args: part.args,
                }
              : { argsText: part.argsText }),
            ...(part.result
              ? { result: part.result as ReadonlyJSONValue }
              : {}),
            ...(part.isError ? { isError: true as const } : {}),
          };
        }

        default: {
          // Skip unsupported types like image, file, audio, data
          return {
            type: "text" as const,
            text: `[Unsupported content type: ${type}]`,
          };
        }
      }
    }),
    metadata: message.metadata as AuiV0Message["metadata"],
    ...(message.status
      ? {
          status:
            message.status?.type === "running"
              ? {
                  type: "incomplete" as const,
                  reason: "cancelled" as const,
                }
              : message.status,
        }
      : undefined),
  };
};
