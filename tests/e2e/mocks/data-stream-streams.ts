/**
 * Mock stream builders for the DataStream protocol (assistant-transport).
 *
 * The DataStream format uses line-based encoding:
 *   {type_code}:{json_value}\n
 *
 * Type codes:
 *   0 = TextDelta, f = StartStep, e = FinishStep, d = FinishMessage
 *   b = StartToolCall, c = ToolCallArgsTextDelta, a = ToolCallResult
 *   3 = Error
 */

const USAGE = { promptTokens: 10, completionTokens: 5 };

let msgCounter = 0;

export function resetDataStreamCounters(): void {
  msgCounter = 0;
}

function line(type: string, value: unknown): string {
  return `${type}:${JSON.stringify(value)}\n`;
}

/** Build a simple text response in DataStream format */
export function createDataStreamTextStream(text: string): string {
  const msgId = `msg_${++msgCounter}`;
  const words = text.split(" ");
  let out = line("f", { messageId: msgId }); // StartStep
  for (let i = 0; i < words.length; i++) {
    const delta = i < words.length - 1 ? `${words[i]} ` : words[i]!;
    out += line("0", delta); // TextDelta
  }
  out += line("e", { finishReason: "stop", usage: USAGE, isContinued: false }); // FinishStep
  out += line("d", { finishReason: "stop", usage: USAGE }); // FinishMessage
  return out;
}

/** Build a tool call + follow-up text in DataStream format */
export function createDataStreamToolCallStream(
  toolName: string,
  args: Record<string, unknown>,
  result: unknown,
  followUpText: string,
): string {
  const msgId = `msg_${++msgCounter}`;
  const toolCallId = `tc_${msgCounter}`;
  let out = line("f", { messageId: msgId });
  out += line("b", { toolCallId, toolName }); // StartToolCall
  out += line("c", { toolCallId, argsTextDelta: JSON.stringify(args) }); // ToolCallArgsTextDelta
  out += line("a", { toolCallId, result: JSON.stringify(result) }); // ToolCallResult
  // Follow-up text
  for (const word of followUpText.split(" ")) {
    out += line(
      "0",
      word === followUpText.split(" ").at(-1) ? word : `${word} `,
    );
  }
  out += line("e", { finishReason: "stop", usage: USAGE, isContinued: false });
  out += line("d", { finishReason: "stop", usage: USAGE });
  return out;
}

/** Build an error stream */
export function createDataStreamErrorStream(errorMessage: string): string {
  return line("3", errorMessage);
}
