import type { Tool } from "assistant-stream";

export type CoreAssistantToolProps<
  TArgs extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
> = Tool<TArgs, TResult> & {
  toolName: string;
  render?: unknown; // Framework-specific, typed by framework bindings
};

export type AssistantInstructionsConfig = {
  disabled?: boolean | undefined;
  instruction: string;
};
