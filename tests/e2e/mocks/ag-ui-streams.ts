/**
 * Mock stream builders for the AG-UI protocol.
 *
 * AG-UI uses Server-Sent Events (SSE) format:
 *   data: {json_event}\n\n
 *
 * Each event has a "type" field (e.g. "TEXT_MESSAGE_CONTENT").
 */

let runCounter = 0;
let agMsgCounter = 0;

export function resetAgUiCounters(): void {
  runCounter = 0;
  agMsgCounter = 0;
}

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/** Build a simple text response in AG-UI SSE format */
export function createAgUiTextStream(text: string): string {
  const runId = `run_${++runCounter}`;
  const messageId = `msg_${++agMsgCounter}`;
  const words = text.split(" ");

  let out = sseEvent({ type: "RUN_STARTED", runId });
  out += sseEvent({ type: "TEXT_MESSAGE_START", messageId });
  for (let i = 0; i < words.length; i++) {
    const delta = i < words.length - 1 ? `${words[i]} ` : words[i]!;
    out += sseEvent({ type: "TEXT_MESSAGE_CONTENT", messageId, delta });
  }
  out += sseEvent({ type: "TEXT_MESSAGE_END", messageId });
  out += sseEvent({ type: "RUN_FINISHED", runId });
  return out;
}

/** Build a tool call + follow-up text in AG-UI SSE format */
export function createAgUiToolCallStream(
  toolName: string,
  args: Record<string, unknown>,
  result: string,
  followUpText: string,
): string {
  const runId = `run_${++runCounter}`;
  const messageId = `msg_${++agMsgCounter}`;
  const toolCallId = `tc_${agMsgCounter}`;
  const followUpMsgId = `msg_${++agMsgCounter}`;

  let out = sseEvent({ type: "RUN_STARTED", runId });
  // Tool call
  out += sseEvent({
    type: "TOOL_CALL_START",
    toolCallId,
    toolCallName: toolName,
  });
  out += sseEvent({
    type: "TOOL_CALL_ARGS",
    toolCallId,
    delta: JSON.stringify(args),
  });
  out += sseEvent({ type: "TOOL_CALL_END", toolCallId });
  out += sseEvent({ type: "TOOL_CALL_RESULT", toolCallId, content: result });
  // Follow-up text
  out += sseEvent({ type: "TEXT_MESSAGE_START", messageId: followUpMsgId });
  for (const word of followUpText.split(" ")) {
    out += sseEvent({
      type: "TEXT_MESSAGE_CONTENT",
      messageId: followUpMsgId,
      delta: word === followUpText.split(" ").at(-1) ? word : `${word} `,
    });
  }
  out += sseEvent({ type: "TEXT_MESSAGE_END", messageId: followUpMsgId });
  out += sseEvent({ type: "RUN_FINISHED", runId });
  return out;
}

/** Build an error stream */
export function createAgUiErrorStream(errorMessage: string): string {
  const runId = `run_${++runCounter}`;
  let out = sseEvent({ type: "RUN_STARTED", runId });
  out += sseEvent({ type: "RUN_ERROR", message: errorMessage });
  return out;
}
