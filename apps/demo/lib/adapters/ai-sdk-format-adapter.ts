import type { UIMessage } from "ai";
import type {
  MessageFormatAdapter,
  MessageFormatItem,
  MessageStorageEntry,
} from "@assistant-ui/react";

/**
 * Custom AI SDK format adapter that preserves file attachments.
 * Unlike the default aiSDKV5FormatAdapter, this does not filter out file parts.
 */
export type AISDKStorageFormat = Omit<UIMessage, "id">;

export const aiSDKFormatAdapterWithAttachments: MessageFormatAdapter<
  UIMessage,
  AISDKStorageFormat
> = {
  format: "ai-sdk/v5",

  encode({
    message: { id, ...message },
  }: MessageFormatItem<UIMessage>): AISDKStorageFormat {
    // Keep all parts including file attachments
    return message;
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
