"use client";

import { useAssistantState } from "../../context";
import type { SourceMessagePart } from "../../types";

/**
 * Hook to get all source parts from the current message.
 * Returns an array of SourceMessagePart sorted by citationIndex (if present).
 *
 * @example
 * ```tsx
 * function MessageSources() {
 *   const sources = useMessageSources();
 *   return (
 *     <ol>
 *       {sources.map((source, i) => (
 *         <li key={source.id}>
 *           <a href={source.url}>{source.title ?? source.url}</a>
 *         </li>
 *       ))}
 *     </ol>
 *   );
 * }
 * ```
 */
export const useMessageSources = (): SourceMessagePart[] => {
  return useAssistantState(({ message }) => {
    const sources = message.content.filter(
      (part): part is SourceMessagePart => part.type === "source",
    );
    // Sort by citationIndex if present
    return sources.sort((a, b) => {
      const aIndex = a.citationIndex ?? Infinity;
      const bIndex = b.citationIndex ?? Infinity;
      return aIndex - bIndex;
    });
  });
};
