import type { AppendMessage } from "@assistant-ui/react";
import type { TanStackMessagePart } from "../types";

/**
 * Convert assistant-ui AppendMessage to TanStack AI message format
 */
export const toCreateMessage = (message: AppendMessage): string => {
  // Extract text content from the message
  const textContent = message.content
    .filter(
      (part): part is Extract<typeof part, { type: "text" }> =>
        part.type === "text",
    )
    .map((part) => part.text)
    .join("\n");

  return textContent;
};

/**
 * Convert assistant-ui AppendMessage to TanStack AI UIMessage parts
 */
export const toTanStackParts = (
  message: AppendMessage,
): TanStackMessagePart[] => {
  const parts: TanStackMessagePart[] = [];

  for (const part of message.content) {
    switch (part.type) {
      case "text":
        parts.push({
          type: "text",
          content: part.text,
        });
        break;

      case "image":
        parts.push({
          type: "image",
          source: {
            type: "url",
            value: part.image,
          },
        });
        break;

      case "file":
        if (part.mimeType?.startsWith("image/")) {
          parts.push({
            type: "image",
            source: {
              type: part.data.startsWith("data:") ? "url" : "data",
              value: part.data,
            },
          });
        } else if (part.mimeType?.startsWith("audio/")) {
          parts.push({
            type: "audio",
            source: {
              type: part.data.startsWith("data:") ? "url" : "data",
              value: part.data,
            },
          });
        } else if (part.mimeType?.startsWith("video/")) {
          parts.push({
            type: "video",
            source: {
              type: part.data.startsWith("data:") ? "url" : "data",
              value: part.data,
            },
          });
        } else {
          parts.push({
            type: "document",
            source: {
              type: part.data.startsWith("data:") ? "url" : "data",
              value: part.data,
            },
          });
        }
        break;

      default:
        // Skip unsupported part types
        break;
    }
  }

  // Also handle attachments
  if (message.attachments) {
    for (const attachment of message.attachments) {
      for (const content of attachment.content) {
        switch (content.type) {
          case "image":
            parts.push({
              type: "image",
              source: {
                type: "url",
                value: content.image,
              },
            });
            break;

          case "file":
            if (content.mimeType?.startsWith("image/")) {
              parts.push({
                type: "image",
                source: {
                  type: content.data.startsWith("data:") ? "url" : "data",
                  value: content.data,
                },
              });
            } else if (content.mimeType?.startsWith("audio/")) {
              parts.push({
                type: "audio",
                source: {
                  type: content.data.startsWith("data:") ? "url" : "data",
                  value: content.data,
                },
              });
            } else if (content.mimeType?.startsWith("video/")) {
              parts.push({
                type: "video",
                source: {
                  type: content.data.startsWith("data:") ? "url" : "data",
                  value: content.data,
                },
              });
            } else {
              parts.push({
                type: "document",
                source: {
                  type: content.data.startsWith("data:") ? "url" : "data",
                  value: content.data,
                },
              });
            }
            break;

          default:
            break;
        }
      }
    }
  }

  return parts;
};
