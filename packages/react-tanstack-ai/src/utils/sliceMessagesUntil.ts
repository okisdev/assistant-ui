import type { TanStackUIMessage } from "../types";

/**
 * Slice messages up to (but not including) the message with the given parentId.
 * Returns all messages if parentId is null.
 */
export const sliceMessagesUntil = <T extends TanStackUIMessage>(
  messages: T[],
  parentId: string | null,
): T[] => {
  if (parentId === null) return [];

  const index = messages.findIndex((m) => m.id === parentId);
  if (index === -1) return messages;

  return messages.slice(0, index + 1);
};
