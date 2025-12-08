import type { useChat } from "@tanstack/ai-react";
import type {
  AttachmentAdapter,
  FeedbackAdapter,
  SpeechSynthesisAdapter,
  ThreadHistoryAdapter,
} from "@assistant-ui/react";
import type { AssistantCloud } from "assistant-cloud";

/**
 * TanStack AI tool call states
 */
export type TanStackToolCallState =
  | "pending"
  | "approval-requested"
  | "executing"
  | "output-available"
  | "output-error"
  | "cancelled";

/**
 * TanStack AI tool result states
 */
export type TanStackToolResultState =
  | "pending"
  | "executing"
  | "output-available"
  | "output-error";

/**
 * TanStack AI text part
 */
export interface TanStackTextPart {
  type: "text";
  content: string;
  metadata?: unknown;
}

/**
 * TanStack AI thinking/reasoning part
 */
export interface TanStackThinkingPart {
  type: "thinking";
  content: string;
  metadata?: unknown;
}

/**
 * TanStack AI tool call part
 */
export interface TanStackToolCallPart {
  type: "tool-call";
  id: string;
  name: string;
  arguments: string;
  state: TanStackToolCallState;
  approval?: {
    approved?: boolean;
    id: string;
    needsApproval: boolean;
  };
  output?: unknown;
}

/**
 * TanStack AI tool result part
 */
export interface TanStackToolResultPart {
  type: "tool-result";
  id: string;
  toolCallId: string;
  tool: string;
  output: unknown;
  state: TanStackToolResultState;
  errorText?: string;
}

/**
 * TanStack AI content part source
 */
export interface TanStackContentPartSource {
  type: "data" | "url";
  value: string;
}

/**
 * TanStack AI image part
 */
export interface TanStackImagePart {
  type: "image";
  source: TanStackContentPartSource;
  metadata?: unknown;
}

/**
 * TanStack AI audio part
 */
export interface TanStackAudioPart {
  type: "audio";
  source: TanStackContentPartSource;
  metadata?: unknown;
}

/**
 * TanStack AI video part
 */
export interface TanStackVideoPart {
  type: "video";
  source: TanStackContentPartSource;
  metadata?: unknown;
}

/**
 * TanStack AI document part
 */
export interface TanStackDocumentPart {
  type: "document";
  source: TanStackContentPartSource;
  metadata?: unknown;
}

/**
 * Union of all TanStack AI message parts
 */
export type TanStackMessagePart =
  | TanStackTextPart
  | TanStackThinkingPart
  | TanStackToolCallPart
  | TanStackToolResultPart
  | TanStackImagePart
  | TanStackAudioPart
  | TanStackVideoPart
  | TanStackDocumentPart;

/**
 * TanStack AI UI message
 */
export interface TanStackUIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: TanStackMessagePart[];
  createdAt?: Date;
}

/**
 * Return type of TanStack AI's useChat hook
 */
export type TanStackChatHelpers = ReturnType<typeof useChat>;

/**
 * Options for the useTanStackAIRuntime hook
 */
export interface TanStackAIRuntimeOptions {
  adapters?: {
    attachments?: AttachmentAdapter | undefined;
    speech?: SpeechSynthesisAdapter | undefined;
    feedback?: FeedbackAdapter | undefined;
    history?: ThreadHistoryAdapter | undefined;
  };
  /**
   * Whether to automatically cancel pending tool calls when user sends a new message.
   * @default true
   */
  cancelPendingToolCallsOnSend?: boolean | undefined;
}

/**
 * Options for the useTanStackChatRuntime hook
 */
export interface TanStackChatRuntimeOptions extends TanStackAIRuntimeOptions {
  /**
   * API endpoint for chat requests.
   * @default '/api/chat'
   */
  api?: string;

  /**
   * Initial messages to populate the chat.
   */
  initialMessages?: TanStackUIMessage[];

  /**
   * Unique identifier for this chat instance.
   */
  id?: string;

  /**
   * Additional body parameters to send with requests.
   */
  body?: Record<string, unknown>;

  /**
   * AssistantCloud instance for thread management.
   */
  cloud?: AssistantCloud | undefined;

  /**
   * Callback when a response is received.
   */
  onResponse?: (response?: Response) => void;

  /**
   * Callback when an error occurs.
   */
  onError?: (error: Error) => void;

  /**
   * Callback when the response stream finishes.
   */
  onFinish?: (message: TanStackUIMessage) => void;
}
