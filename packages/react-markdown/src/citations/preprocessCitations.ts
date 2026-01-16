import type { SourceMessagePart } from "@assistant-ui/react";

export type PreprocessCitationsOptions = {
  /**
   * Custom regex pattern to match citation markers.
   * Must have a capturing group for the citation number.
   * @default /\[(\d+)\]/g
   */
  pattern?: RegExp;
};

/**
 * Preprocesses text to convert citation markers (e.g., [1], [2]) into
 * HTML cite elements that can be rendered as interactive citation links.
 *
 * @param text - The markdown text containing citation markers
 * @param sources - Array of SourceMessagePart from the message
 * @param options - Optional configuration
 * @returns Text with citation markers converted to <cite> elements
 *
 * @example
 * ```tsx
 * const sources = useMessageSources();
 *
 * <MarkdownTextPrimitive
 *   preprocess={(text) => preprocessCitations(text, sources)}
 *   components={{
 *     cite: CitationLink,
 *   }}
 * />
 * ```
 */
export const preprocessCitations = (
  text: string,
  sources: readonly SourceMessagePart[],
  options?: PreprocessCitationsOptions,
): string => {
  const pattern = options?.pattern ?? /\[(\d+)\]/g;

  return text.replace(pattern, (match, numStr: string) => {
    const num = parseInt(numStr, 10);
    // Find source by citationIndex or by 1-based array position
    const source =
      sources.find((s) => s.citationIndex === num) ?? sources[num - 1];

    if (!source) {
      // No matching source found, return original marker
      return match;
    }

    // Return cite element with data attributes for the CitationLink component
    return `<cite data-source-id="${source.id}" data-source-index="${num}">${num}</cite>`;
  });
};
