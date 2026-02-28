"use client";

import { type Tool, toToolsJSONSchema } from "assistant-stream";

type ThreadMessageLike = {
  id: string;
  role: string;
  content: unknown;
  name?: string;
  toolCallId?: string;
  error?: string;
};

type AgUiToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type AgUiMessage =
  | {
      id: string;
      role: string;
      content: string;
      name?: string;
      toolCalls?: AgUiToolCall[];
    }
  | {
      id: string;
      role: "tool";
      content: string;
      toolCallId: string;
      error?: string;
    };

type ToolCallPart = {
  type: "tool-call";
  toolCallId?: string;
  toolName?: string;
  argsText?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  isError?: boolean;
};

type ToolCallLocation = {
  messageIndex: number;
  partIndex: number;
};

type ToolResultPayload = {
  id: string;
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError: boolean | undefined;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const getToolCallId = (record: Record<string, unknown>) =>
  getString(record, "toolCallId") ?? getString(record, "tool_call_id");

function parseJSONObject(
  value: string | undefined,
): Record<string, unknown> | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // noop
  }
  return undefined;
}

function parseResultContent(content: string): unknown {
  if (!content) return content;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function generateId(): string {
  return (
    (globalThis.crypto as { randomUUID?: () => string })?.randomUUID?.() ??
    Math.random().toString(36).slice(2)
  );
}

function normalizeToolCall(part: ToolCallPart): {
  id: string;
  call: AgUiToolCall;
} {
  const id = part.toolCallId ?? generateId();
  const argsText =
    typeof part.argsText === "string"
      ? part.argsText
      : JSON.stringify(part.args ?? {});

  return {
    id,
    call: {
      id,
      type: "function",
      function: {
        name: part.toolName ?? "tool",
        arguments: argsText,
      },
    },
  };
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        part?.type === "text" && typeof part?.text === "string",
    )
    .map((part) => part.text)
    .join("\n");
}

function normalizeAssistantToolCall(value: unknown): ToolCallPart | null {
  if (!isObject(value)) return null;
  const rawFunction = isObject(value["function"])
    ? (value["function"] as Record<string, unknown>)
    : undefined;
  const toolCallId = getString(value, "id") ?? getString(value, "toolCallId");
  const toolName =
    getString(value, "toolName") ??
    getString(value, "name") ??
    getString(rawFunction ?? {}, "name") ??
    "tool";
  const argsText =
    getString(value, "argsText") ??
    getString(value, "arguments") ??
    getString(rawFunction ?? {}, "arguments");
  const explicitArgs = value["args"];
  const argsFromText = parseJSONObject(argsText);
  const args =
    argsFromText ??
    (explicitArgs &&
    typeof explicitArgs === "object" &&
    !Array.isArray(explicitArgs)
      ? (explicitArgs as Record<string, unknown>)
      : undefined);

  return {
    type: "tool-call",
    ...(toolCallId ? { toolCallId } : {}),
    toolName,
    argsText: argsText ?? JSON.stringify(args ?? {}),
    ...(args ? { args } : {}),
  };
}

function normalizeToolPartFromContent(value: unknown): ToolCallPart | null {
  if (!isObject(value) || value["type"] !== "tool-call") return null;
  const normalized = normalizeAssistantToolCall(value);
  if (!normalized) return null;
  const result = value["result"];
  const isErrorValue = value["isError"];
  return {
    ...normalized,
    ...(result !== undefined ? { result } : {}),
    ...(typeof isErrorValue === "boolean" ? { isError: isErrorValue } : {}),
  };
}

function extractToolCallsFromAssistantMessage(
  message: Record<string, unknown>,
): ToolCallPart[] {
  const toolCallParts: ToolCallPart[] = [];
  const seenToolCallIds = new Set<string>();
  const pushPart = (part: ToolCallPart | null) => {
    if (!part) return;
    const id = part.toolCallId ?? generateId();
    if (seenToolCallIds.has(id)) return;
    seenToolCallIds.add(id);
    toolCallParts.push({
      ...part,
      toolCallId: id,
    });
  };

  const content = message["content"];
  if (Array.isArray(content)) {
    for (const part of content) {
      pushPart(normalizeToolPartFromContent(part));
    }
  }

  const toolCalls = Array.isArray(message["toolCalls"])
    ? message["toolCalls"]
    : Array.isArray(message["tool_calls"])
      ? message["tool_calls"]
      : [];
  for (const call of toolCalls) {
    pushPart(normalizeAssistantToolCall(call));
  }

  return toolCallParts;
}

function attachToolCallLocations(
  message: ThreadMessageLike,
  messageIndex: number,
  locations: Map<string, ToolCallLocation>,
) {
  if (!Array.isArray(message.content)) return;
  for (let partIndex = 0; partIndex < message.content.length; partIndex++) {
    const part = message.content[partIndex];
    if (!isObject(part) || part["type"] !== "tool-call") continue;
    const toolCallId = getString(part, "toolCallId");
    if (!toolCallId) continue;
    locations.set(toolCallId, { messageIndex, partIndex });
  }
}

function extractToolResultMessageResult(
  message: Record<string, unknown>,
): unknown {
  const explicitResult = message["result"];
  if (explicitResult !== undefined) return explicitResult;
  const content = message["content"];
  if (typeof content === "string") return parseResultContent(content);
  return content;
}

function resolveToolMessagePayload(
  message: Record<string, unknown>,
): ToolResultPayload {
  const rawToolCallId = getToolCallId(message);
  const toolCallId = rawToolCallId ?? `tool-${generateId()}`;
  const hasErrorFlag =
    typeof message["error"] === "string" ||
    message["isError"] === true ||
    message["status"] === "error";
  const explicitFalse = message["isError"] === false;
  const isError = hasErrorFlag ? true : explicitFalse ? false : undefined;

  return {
    id: getString(message, "id") ?? toolCallId,
    toolCallId,
    toolName:
      getString(message, "name") ?? getString(message, "toolName") ?? "tool",
    result: extractToolResultMessageResult(message),
    isError,
  };
}

function setToolCallResultOnMessage(
  message: ThreadMessageLike,
  partIndex: number,
  result: unknown,
  isError: boolean | undefined,
): ThreadMessageLike | null {
  if (!Array.isArray(message.content)) return null;

  const part = message.content[partIndex];
  if (!isObject(part) || part["type"] !== "tool-call") return null;

  const updatedPart: ToolCallPart = {
    ...(part as ToolCallPart),
    result,
    ...(isError !== undefined ? { isError } : {}),
  };
  const updatedContent = message.content.map((contentPart, idx) =>
    idx === partIndex ? updatedPart : contentPart,
  );

  return {
    ...message,
    content: updatedContent,
  };
}

function applyToolResultToExistingMessage(
  converted: ThreadMessageLike[],
  locations: Map<string, ToolCallLocation>,
  payload: ToolResultPayload,
): boolean {
  const location = locations.get(payload.toolCallId);
  if (!location) return false;

  const targetMessage = converted[location.messageIndex];
  if (!targetMessage) return false;

  const updatedMessage = setToolCallResultOnMessage(
    targetMessage,
    location.partIndex,
    payload.result,
    payload.isError,
  );
  if (!updatedMessage) return false;

  converted[location.messageIndex] = updatedMessage;
  return true;
}

function createSyntheticToolResultMessage(
  payload: ToolResultPayload,
): ThreadMessageLike {
  return {
    id: `${payload.id}:assistant`,
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: payload.toolCallId,
        toolName: payload.toolName,
        args: {},
        argsText: "{}",
        result: payload.result,
        ...(payload.isError !== undefined ? { isError: payload.isError } : {}),
      },
    ],
  };
}

function normalizeAssistantSnapshotMessage(
  rawMessage: Record<string, unknown>,
): ThreadMessageLike {
  const text = extractText(rawMessage["content"]);
  const toolCallParts = extractToolCallsFromAssistantMessage(rawMessage);
  const assistantContent = [
    ...(text.length > 0 ? [{ type: "text" as const, text }] : []),
    ...toolCallParts,
  ];
  const messageName = getString(rawMessage, "name");
  return {
    id: getString(rawMessage, "id") ?? generateId(),
    role: "assistant",
    content: assistantContent.length > 0 ? assistantContent : "",
    ...(messageName !== undefined ? { name: messageName } : {}),
  };
}

function normalizeUserOrSystemSnapshotMessage(
  role: "user" | "system",
  rawMessage: Record<string, unknown>,
): ThreadMessageLike {
  const messageName = getString(rawMessage, "name");
  return {
    id: getString(rawMessage, "id") ?? generateId(),
    role,
    content: extractText(rawMessage["content"]),
    ...(messageName !== undefined ? { name: messageName } : {}),
  };
}

export function fromAgUiMessages(
  messages: readonly unknown[],
): ThreadMessageLike[] {
  const converted: ThreadMessageLike[] = [];
  const toolCallLocations = new Map<string, ToolCallLocation>();

  for (const rawMessage of messages) {
    if (!isObject(rawMessage)) continue;
    const role = getString(rawMessage, "role");
    if (!role) continue;

    if (role === "tool") {
      const payload = resolveToolMessagePayload(rawMessage);
      if (
        applyToolResultToExistingMessage(converted, toolCallLocations, payload)
      ) {
        continue;
      }

      const syntheticMessage = createSyntheticToolResultMessage(payload);
      converted.push(syntheticMessage);
      attachToolCallLocations(
        syntheticMessage,
        converted.length - 1,
        toolCallLocations,
      );
      continue;
    }

    if (role === "assistant") {
      const message = normalizeAssistantSnapshotMessage(rawMessage);
      converted.push(message);
      attachToolCallLocations(message, converted.length - 1, toolCallLocations);
      continue;
    }

    if (role === "user" || role === "system") {
      converted.push(normalizeUserOrSystemSnapshotMessage(role, rawMessage));
    }
  }

  return converted;
}

function convertAssistantMessage(
  message: ThreadMessageLike,
  converted: AgUiMessage[],
): void {
  const content = extractText(message.content);
  const contentArray = Array.isArray(message.content) ? message.content : [];

  const toolCallParts = contentArray.filter(
    (part): part is ToolCallPart => part?.type === "tool-call",
  );

  const toolCalls = toolCallParts.map((part) => ({
    ...normalizeToolCall(part),
    part,
  }));

  const assistantMessage: AgUiMessage = {
    id: message.id,
    role: "assistant",
    content,
  };
  if (message.name) {
    assistantMessage.name = message.name;
  }
  if (toolCalls.length > 0) {
    assistantMessage.toolCalls = toolCalls.map((entry) => entry.call);
  }
  converted.push(assistantMessage);

  for (const { id: toolCallId, part } of toolCalls) {
    if (part.result === undefined) continue;

    const resultContent =
      typeof part.result === "string"
        ? part.result
        : JSON.stringify(part.result);

    const toolMessage: AgUiMessage = {
      id: `${toolCallId}:tool`,
      role: "tool",
      content: resultContent,
      toolCallId,
    };
    if (part.isError) {
      toolMessage.error = resultContent;
    }
    converted.push(toolMessage);
  }
}

function convertToolMessage(
  message: ThreadMessageLike,
  converted: AgUiMessage[],
): void {
  const content = extractText(message.content);
  const toolCallId = message.toolCallId ?? generateId();

  const toolMessage: AgUiMessage = {
    id: message.id,
    role: "tool",
    content,
    toolCallId,
  };
  if (typeof message.error === "string") {
    toolMessage.error = message.error;
  }
  converted.push(toolMessage);
}

export function toAgUiMessages(
  messages: readonly ThreadMessageLike[],
): AgUiMessage[] {
  const converted: AgUiMessage[] = [];

  for (const message of messages) {
    if (message.role === "assistant") {
      convertAssistantMessage(message, converted);
      continue;
    }

    if (message.role === "tool") {
      convertToolMessage(message, converted);
      continue;
    }

    const genericMessage: AgUiMessage = {
      id: message.id,
      role: message.role,
      content: extractText(message.content),
    };
    if (message.name) {
      genericMessage.name = message.name;
    }
    converted.push(genericMessage);
  }

  return converted;
}

type AgUiTool = {
  name: string;
  description: string | undefined;
  parameters: unknown;
};

export function toAgUiTools(
  tools: Record<string, Tool> | undefined,
): AgUiTool[] {
  if (!tools) return [];

  const toolsSchema = toToolsJSONSchema(tools);
  return Object.entries(toolsSchema).map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}
