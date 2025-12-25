export type ParsedChainOfThought = {
  thinking: string | null;
  content: string;
  isThinkingComplete: boolean;
};

export function parseChainOfThought(text: string): ParsedChainOfThought {
  const thinkingStartTag = "<thinking>";
  const thinkingEndTag = "</thinking>";

  const startIndex = text.indexOf(thinkingStartTag);

  if (startIndex === -1) {
    return {
      thinking: null,
      content: text.trim(),
      isThinkingComplete: true,
    };
  }

  const endIndex = text.indexOf(thinkingEndTag, startIndex);

  if (endIndex !== -1) {
    const thinkingContent = text
      .slice(startIndex + thinkingStartTag.length, endIndex)
      .trim();

    const beforeThinking = text.slice(0, startIndex).trim();
    const afterThinking = text.slice(endIndex + thinkingEndTag.length).trim();

    const content = [beforeThinking, afterThinking]
      .filter(Boolean)
      .join("\n\n");

    return {
      thinking: thinkingContent,
      content,
      isThinkingComplete: true,
    };
  }

  const thinkingContent = text
    .slice(startIndex + thinkingStartTag.length)
    .trim();
  const beforeThinking = text.slice(0, startIndex).trim();

  return {
    thinking: thinkingContent,
    content: beforeThinking,
    isThinkingComplete: false,
  };
}

export function hasChainOfThought(text: string): boolean {
  return text.includes("<thinking>");
}
