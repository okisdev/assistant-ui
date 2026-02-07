/**
 * Mock UIMessageStream response builders for Playwright E2E tests.
 *
 * AI SDK v6 UIMessageStream format: Server-Sent Events (SSE) with JSON payloads.
 * Each event: `data: {JSON}\n\n`
 * Stream terminator: `data: [DONE]\n\n`
 *
 * IMPORTANT: AI SDK v6 uses different field names from assistant-stream:
 * - text-delta: `delta` (not `textDelta`), requires `id`
 * - tool: `tool-input-*` / `tool-output-*` (not `tool-call-*` / `tool-result`)
 * - All text/reasoning chunks require matching `id` fields
 */

type AISDKv6Chunk =
  | { type: "start"; messageId?: string }
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string }
  | { type: "reasoning-start"; id: string }
  | { type: "reasoning-delta"; id: string; delta: string }
  | { type: "reasoning-end"; id: string }
  | {
      type: "tool-input-start";
      toolCallId: string;
      toolName: string;
    }
  | { type: "tool-input-delta"; toolCallId: string; inputTextDelta: string }
  | {
      type: "tool-input-available";
      toolCallId: string;
      toolName: string;
      input: unknown;
    }
  | { type: "tool-output-available"; toolCallId: string; output: unknown }
  | { type: "start-step" }
  | { type: "finish-step" }
  | { type: "finish"; finishReason?: string }
  | { type: "error"; errorText: string };

function encodeChunk(chunk: AISDKv6Chunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

function encodeStream(chunks: AISDKv6Chunk[]): string {
  return chunks.map(encodeChunk).join("") + "data: [DONE]\n\n";
}

let messageCounter = 0;
function nextMessageId(): string {
  return `msg_mock_${++messageCounter}`;
}

let partCounter = 0;
function nextPartId(): string {
  return `part_mock_${++partCounter}`;
}

let toolCallCounter = 0;
function nextToolCallId(): string {
  return `call_mock_${++toolCallCounter}`;
}

/** Create a simple text response stream */
export function createTextStream(text: string): string {
  const messageId = nextMessageId();
  const textId = nextPartId();
  const words = text.split(" ");
  const chunks: AISDKv6Chunk[] = [
    { type: "start", messageId },
    { type: "start-step" },
    { type: "text-start", id: textId },
    ...words.map((word, i) => ({
      type: "text-delta" as const,
      id: textId,
      delta: i < words.length - 1 ? word + " " : word,
    })),
    { type: "text-end", id: textId },
    { type: "finish-step" },
    { type: "finish", finishReason: "stop" },
  ];
  return encodeStream(chunks);
}

/** Create a multi-chunk text response (simulates real streaming behavior) */
export function createStreamingTextResponse(textChunks: string[]): string {
  const messageId = nextMessageId();
  const textId = nextPartId();
  const chunks: AISDKv6Chunk[] = [
    { type: "start", messageId },
    { type: "start-step" },
    { type: "text-start", id: textId },
    ...textChunks.map((chunk) => ({
      type: "text-delta" as const,
      id: textId,
      delta: chunk,
    })),
    { type: "text-end", id: textId },
    { type: "finish-step" },
    { type: "finish", finishReason: "stop" },
  ];
  return encodeStream(chunks);
}

/** Create a tool call + result response stream */
export function createToolCallStream(
  toolName: string,
  args: Record<string, unknown>,
  result: unknown,
  followUpText?: string,
): string {
  const messageId = nextMessageId();
  const toolCallId = nextToolCallId();
  const chunks: AISDKv6Chunk[] = [
    { type: "start", messageId },
    { type: "start-step" },
    { type: "tool-input-start", toolCallId, toolName },
    {
      type: "tool-input-delta",
      toolCallId,
      inputTextDelta: JSON.stringify(args),
    },
    { type: "tool-input-available", toolCallId, toolName, input: args },
    { type: "tool-output-available", toolCallId, output: result },
    { type: "finish-step" },
  ];

  if (followUpText) {
    const textId = nextPartId();
    chunks.push(
      { type: "start-step" },
      { type: "text-start", id: textId },
      { type: "text-delta", id: textId, delta: followUpText },
      { type: "text-end", id: textId },
      { type: "finish-step" },
    );
  }

  chunks.push({ type: "finish", finishReason: "stop" });
  return encodeStream(chunks);
}

/** Create an error response stream */
export function createErrorStream(errorText: string): string {
  const messageId = nextMessageId();
  const chunks: AISDKv6Chunk[] = [
    { type: "start", messageId },
    { type: "error", errorText },
  ];
  return encodeStream(chunks);
}

/** Create a reasoning + text response stream */
export function createReasoningStream(reasoning: string, text: string): string {
  const messageId = nextMessageId();
  const reasoningId = nextPartId();
  const textId = nextPartId();
  const chunks: AISDKv6Chunk[] = [
    { type: "start", messageId },
    { type: "start-step" },
    { type: "reasoning-start", id: reasoningId },
    { type: "reasoning-delta", id: reasoningId, delta: reasoning },
    { type: "reasoning-end", id: reasoningId },
    { type: "text-start", id: textId },
    { type: "text-delta", id: textId, delta: text },
    { type: "text-end", id: textId },
    { type: "finish-step" },
    { type: "finish", finishReason: "stop" },
  ];
  return encodeStream(chunks);
}

/** Reset counters (call in test setup) */
export function resetMockCounters(): void {
  messageCounter = 0;
  partCounter = 0;
  toolCallCounter = 0;
}
