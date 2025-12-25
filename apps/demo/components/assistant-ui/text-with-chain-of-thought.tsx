"use client";

import { type FC, memo, useMemo } from "react";
import {
  useMessagePartText,
  TextMessagePartProvider,
} from "@assistant-ui/react";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ChainOfThoughtContent } from "@/components/assistant-ui/chain-of-thought-content";
import { parseChainOfThought } from "@/lib/ai/parse-chain-of-thought";

const TextWithChainOfThoughtImpl: FC = () => {
  const { text, status } = useMessagePartText();
  const isStreaming = status?.type === "running";

  const parsed = useMemo(() => {
    return parseChainOfThought(text);
  }, [text]);

  if (!parsed.thinking) {
    return <MarkdownText />;
  }

  return (
    <>
      <ChainOfThoughtContent
        text={parsed.thinking}
        isStreaming={isStreaming && !parsed.isThinkingComplete}
      />

      {parsed.content && (
        <TextMessagePartProvider
          text={parsed.content}
          isRunning={isStreaming && parsed.isThinkingComplete}
        >
          <MarkdownText />
        </TextMessagePartProvider>
      )}
    </>
  );
};

export const TextWithChainOfThought = memo(TextWithChainOfThoughtImpl);
