/**
 * Mock stream builders for the DataStream protocol (assistant-transport).
 *
 * The DataStream format uses line-based encoding:
 *   {type_code}:{json_value}\n
 *
 * Type codes:
 *   0 = TextDelta, f = StartStep, e = FinishStep, d = FinishMessage
 *   b = StartToolCall, c = ToolCallArgsTextDelta, a = ToolCallResult
 *   3 = Error, aui-state = UpdateStateOperations
 *
 * IMPORTANT: useAssistantTransportRuntime skips ALL chunks unless
 * unstable_state changes (via aui-state operations). The converter
 * reads state.messages (LangChain format) to produce thread messages.
 * Without aui-state, the assistant response is never rendered.
 *
 * The stream builders return DataStreamResult with both the encoded body
 * and the LangChain messages they represent. The handler accumulates
 * messages and prepends the aui-state line with the full history.
 */

const USAGE = { promptTokens: 10, completionTokens: 5 };

let msgCounter = 0;

export function resetDataStreamCounters(): void {
  msgCounter = 0;
}

function line(type: string, value: unknown): string {
  return `${type}:${JSON.stringify(value)}\n`;
}

/** Build aui-state line that sets messages array */
export function stateUpdateLine(messages: unknown[]): string {
  return line("aui-state", [
    { type: "set", path: ["messages"], value: messages },
  ]);
}

export interface DataStreamResult {
  /** The DataStream-encoded body (without aui-state) */
  body: string;
  /** LangChain messages this response represents (added to state by handler) */
  langChainMessages: unknown[];
}

/** Build a simple text response in DataStream format */
export function createDataStreamTextStream(text: string): DataStreamResult {
  const msgId = `msg_${++msgCounter}`;
  const words = text.split(" ");

  let body = line("f", { messageId: msgId }); // StartStep
  for (let i = 0; i < words.length; i++) {
    const delta = i < words.length - 1 ? `${words[i]} ` : words[i]!;
    body += line("0", delta); // TextDelta
  }
  body += line("e", {
    finishReason: "stop",
    usage: USAGE,
    isContinued: false,
  }); // FinishStep
  body += line("d", { finishReason: "stop", usage: USAGE }); // FinishMessage

  return {
    body,
    langChainMessages: [{ type: "ai", content: [{ type: "text", text }] }],
  };
}

/** Build a tool call + follow-up text in DataStream format */
export function createDataStreamToolCallStream(
  toolName: string,
  args: Record<string, unknown>,
  result: unknown,
  followUpText: string,
): DataStreamResult {
  const msgId = `msg_${++msgCounter}`;
  const toolCallId = `tc_${msgCounter}`;

  let body = line("f", { messageId: msgId });
  body += line("b", { toolCallId, toolName }); // StartToolCall
  body += line("c", { toolCallId, argsTextDelta: JSON.stringify(args) }); // ToolCallArgsTextDelta
  body += line("a", { toolCallId, result: JSON.stringify(result) }); // ToolCallResult
  // Follow-up text
  const followUpWords = followUpText.split(" ");
  for (let i = 0; i < followUpWords.length; i++) {
    const delta =
      i < followUpWords.length - 1 ? `${followUpWords[i]} ` : followUpWords[i]!;
    body += line("0", delta);
  }
  body += line("e", {
    finishReason: "stop",
    usage: USAGE,
    isContinued: false,
  });
  body += line("d", { finishReason: "stop", usage: USAGE });

  return {
    body,
    langChainMessages: [
      {
        type: "ai",
        content: [],
        tool_calls: [{ name: toolName, args, id: toolCallId }],
      },
      {
        type: "tool",
        content: JSON.stringify(result),
        tool_call_id: toolCallId,
        name: toolName,
      },
      { type: "ai", content: [{ type: "text", text: followUpText }] },
    ],
  };
}

/** Build an error stream */
export function createDataStreamErrorStream(
  errorMessage: string,
): DataStreamResult {
  return {
    body: line("3", errorMessage),
    langChainMessages: [],
  };
}
