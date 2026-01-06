"use client";

import "@assistant-ui/react-markdown/styles/dot.css";
import "katex/dist/katex.min.css";

import {
  type CodeHeaderProps,
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { type FC, memo, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { MermaidDiagram } from "./mermaid-diagram";
import { SyntaxHighlighter } from "./shiki-syntax-highlighter";

import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

function preprocessNestedCodeBlocks(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const openMatch = line.match(/^(`{3,})(\w*)$/);

    if (openMatch) {
      const fenceLength = openMatch[1].length;
      const language = openMatch[2];
      const blockLines: string[] = [];
      let maxNestedFence = 0;
      let j = i + 1;

      while (j < lines.length) {
        const innerLine = lines[j];
        const closeMatch = innerLine.match(/^(`{3,})$/);

        if (closeMatch && closeMatch[1].length >= fenceLength) {
          break;
        }

        const nestedFenceMatch = innerLine.match(/^(`{3,})/);
        if (nestedFenceMatch) {
          maxNestedFence = Math.max(maxNestedFence, nestedFenceMatch[1].length);
        }

        blockLines.push(innerLine);
        j++;
      }

      if (maxNestedFence >= fenceLength) {
        const newFenceLength = maxNestedFence + 1;
        const newFence = "`".repeat(newFenceLength);
        result.push(`${newFence}${language}`);
        result.push(...blockLines);
        result.push(newFence);
      } else {
        result.push(line);
        result.push(...blockLines);
        if (j < lines.length) {
          result.push(lines[j]);
        }
      }

      i = j + 1;
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join("\n");
}

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      className="aui-md"
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={defaultComponents}
      componentsByLanguage={{
        mermaid: { SyntaxHighlighter: MermaidDiagram },
      }}
      preprocess={preprocessNestedCodeBlocks}
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="mt-4 flex items-center justify-between gap-4 rounded-t-lg bg-muted px-4 py-2 text-muted-foreground text-sm">
      <span className="lowercase">{language}</span>
      <TooltipIconButton tooltip="Copy" onClick={onCopy}>
        {!isCopied && <CopyIcon />}
        {isCopied && <CheckIcon />}
      </TooltipIconButton>
    </div>
  );
};

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};

const defaultComponents = memoizeMarkdownComponents({
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mb-4 font-semibold text-2xl tracking-tight", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-6 mb-3 font-semibold text-xl tracking-tight first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-4 mb-2 font-semibold text-lg tracking-tight first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("mt-4 mb-2 font-medium first:mt-0", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("my-3 leading-7 first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "font-medium text-foreground underline underline-offset-4",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "border-muted border-l-2 pl-4 text-muted-foreground italic",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-3 ml-6 list-disc [&>li]:mt-1", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-3 ml-6 list-decimal [&>li]:mt-1", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-4 border-muted", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <table
      className={cn(
        "my-4 w-full border-collapse overflow-hidden rounded-lg",
        className,
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn("bg-muted px-4 py-2 text-left font-medium", className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn("border-muted border-t px-4 py-2 text-left", className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "overflow-x-auto rounded-b-lg bg-muted/50 p-4 font-mono text-sm",
        className,
      )}
      {...props}
    />
  ),
  code: function Code({ className, children, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();

    // Code blocks are handled by SyntaxHighlighter
    // This only handles inline code
    if (isCodeBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  SyntaxHighlighter,
  CodeHeader,
});
