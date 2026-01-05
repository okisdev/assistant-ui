import type { UIMessage } from "ai";

// Re-export the generic ResumableStateManager from @assistant-ui/react/resumable
export {
  ResumableStateManager,
  parseSSEStreamToText,
  parseSSEStreamToChunks,
} from "@assistant-ui/react/resumable";

/**
 * Parse a SSE stream response and extract text content.
 * This is a convenience alias for parseSSEStreamToText.
 * @deprecated Use parseSSEStreamToText from @assistant-ui/react/resumable instead
 */
export { parseSSEStreamToText as parseStreamToText } from "@assistant-ui/react/resumable";

/**
 * Extract text content from a UIMessage.
 * Handles both `parts` format (new) and `content` format (legacy).
 */
function extractTextFromMessage(message: UIMessage): string {
  // Try parts format first (new AI SDK format)
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts.filter(
      (p): p is { type: "text"; text: string } =>
        p.type === "text" && typeof (p as { text?: unknown }).text === "string",
    );
    return textParts.map((p) => p.text).join("");
  }

  // Fall back to content format (legacy or alternative format)
  const content = (message as unknown as { content?: string }).content;
  if (typeof content === "string") {
    return content;
  }

  return "";
}

/**
 * Create restored messages from stored messages and AI response text.
 * This is AI SDK specific as it uses the UIMessage format.
 */
export function createRestoredMessages(
  storedMessages: UIMessage[],
  aiText: string,
): UIMessage[] {
  const lastUserMessage = storedMessages[storedMessages.length - 1];
  if (!lastUserMessage) {
    return [];
  }

  const userText = extractTextFromMessage(lastUserMessage);

  if (!userText) {
    return [];
  }

  return [
    {
      id: `restored-user-${Date.now()}`,
      role: "user" as const,
      parts: [{ type: "text" as const, text: userText }],
    },
    {
      id: `restored-assistant-${Date.now()}`,
      role: "assistant" as const,
      parts: [
        {
          type: "text" as const,
          text: aiText || "(Response was interrupted)",
        },
      ],
    },
  ];
}
