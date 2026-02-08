/**
 * Mock LangGraph streaming response builders for Playwright E2E tests.
 *
 * LangGraph uses SSE with named events:
 *   event: <event-type>\n
 *   data: <json>\n\n
 *
 * Event types: metadata, messages/partial, messages/complete, updates, error, end
 * Message format: LangChain message objects (type: "ai" | "human" | "tool")
 */

interface LangChainAIMessage {
  id: string;
  type: "ai";
  content: string | Array<{ type: string; text?: string }>;
  tool_calls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
  }>;
  additional_kwargs?: Record<string, unknown>;
}

interface LangChainToolMessage {
  id: string;
  type: "tool";
  content: string;
  tool_call_id: string;
  name: string;
  status: "success" | "error";
}

function encodeLangGraphEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

let msgCounter = 0;
function nextMsgId(): string {
  return `msg_lg_${++msgCounter}`;
}

let toolCallCounter = 0;
function nextToolCallId(): string {
  return `tc_lg_${++toolCallCounter}`;
}

/** Create a simple text response stream */
export function createLangGraphTextStream(text: string): string {
  const msgId = nextMsgId();
  const message: LangChainAIMessage = {
    id: msgId,
    type: "ai",
    content: text,
    tool_calls: [],
    additional_kwargs: {},
  };

  return [
    encodeLangGraphEvent("metadata", { run_id: `run_${Date.now()}` }),
    encodeLangGraphEvent("messages/partial", [message]),
    encodeLangGraphEvent("messages/complete", [message]),
    encodeLangGraphEvent("end", null),
  ].join("");
}

/** Create a tool call + tool result + follow-up text stream */
export function createLangGraphToolCallStream(
  toolName: string,
  args: Record<string, unknown>,
  result: string,
  followUpText: string,
): string {
  const aiMsgId = nextMsgId();
  const toolCallId = nextToolCallId();
  const toolMsgId = nextMsgId();
  const followUpMsgId = nextMsgId();

  const aiMessage: LangChainAIMessage = {
    id: aiMsgId,
    type: "ai",
    content: "",
    tool_calls: [{ id: toolCallId, name: toolName, args }],
    additional_kwargs: {},
  };

  const toolMessage: LangChainToolMessage = {
    id: toolMsgId,
    type: "tool",
    content: result,
    tool_call_id: toolCallId,
    name: toolName,
    status: "success",
  };

  const followUpMessage: LangChainAIMessage = {
    id: followUpMsgId,
    type: "ai",
    content: followUpText,
    tool_calls: [],
    additional_kwargs: {},
  };

  return [
    encodeLangGraphEvent("metadata", { run_id: `run_${Date.now()}` }),
    encodeLangGraphEvent("messages/partial", [aiMessage]),
    encodeLangGraphEvent("messages/complete", [aiMessage]),
    encodeLangGraphEvent("messages/partial", [aiMessage, toolMessage]),
    encodeLangGraphEvent("messages/complete", [aiMessage, toolMessage]),
    encodeLangGraphEvent("messages/partial", [
      aiMessage,
      toolMessage,
      followUpMessage,
    ]),
    encodeLangGraphEvent("messages/complete", [
      aiMessage,
      toolMessage,
      followUpMessage,
    ]),
    encodeLangGraphEvent("end", null),
  ].join("");
}

/** Create an error stream */
export function createLangGraphErrorStream(errorMessage: string): string {
  return [
    encodeLangGraphEvent("metadata", { run_id: `run_${Date.now()}` }),
    encodeLangGraphEvent("error", { message: errorMessage }),
  ].join("");
}

/** Create a thread creation response */
export function createThreadResponse(threadId: string): string {
  return JSON.stringify({
    thread_id: threadId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
    status: "idle",
  });
}

/** Create a thread state response (for loading an existing thread) */
export function createThreadStateResponse(
  messages: Array<{
    role: "human" | "ai";
    content: string;
    id?: string;
  }> = [],
): string {
  const langChainMessages = messages.map((msg, i) => ({
    id: msg.id ?? `msg_state_${i}`,
    type: msg.role,
    content: msg.content,
    ...(msg.role === "ai" ? { tool_calls: [], additional_kwargs: {} } : {}),
  }));

  return JSON.stringify({
    values: { messages: langChainMessages },
    next: [],
    tasks: [],
  });
}

/** Reset counters */
export function resetLangGraphCounters(): void {
  msgCounter = 0;
  toolCallCounter = 0;
}
