import { UIMessage } from "ai";
import {
  MessageFormatAdapter,
  MessageFormatItem,
  MessageStorageEntry,
} from "@assistant-ui/react";

// Storage format for AI SDK messages - just the UIMessage
export type AISDKStorageFormat = Omit<UIMessage, "id">;

/**
 * Message format adapter for AI SDK.
 * Uses "ai-sdk/v5" format string for backward compatibility with existing stored messages.
 * The format is compatible with both AI SDK v5 and v6.
 */
export const aiSDKFormatAdapter: MessageFormatAdapter<
  UIMessage,
  AISDKStorageFormat
> = {
  // Keep "ai-sdk/v5" format string for backward compatibility
  // The message format itself hasn't changed between v5 and v6
  format: "ai-sdk/v5",

  encode({
    message: { id, parts, ...message },
  }: MessageFormatItem<UIMessage>): AISDKStorageFormat {
    // Filter out FileContentParts until they are supported
    return {
      ...message,
      parts: parts.filter((part) => part.type !== "file"),
    };
  },

  decode(
    stored: MessageStorageEntry<AISDKStorageFormat>,
  ): MessageFormatItem<UIMessage> {
    return {
      parentId: stored.parent_id,
      message: {
        id: stored.id,
        ...stored.content,
      },
    };
  },

  getId(message: UIMessage): string {
    return message.id;
  },
};

/**
 * @deprecated Use `aiSDKFormatAdapter` instead. This export is kept for backward compatibility.
 */
export const aiSDKV5FormatAdapter = aiSDKFormatAdapter;
