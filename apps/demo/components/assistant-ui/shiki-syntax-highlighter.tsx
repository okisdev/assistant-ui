"use client";

import { type FC } from "react";
import ShikiHighlighter, { type ShikiHighlighterProps } from "react-shiki";
import type { SyntaxHighlighterProps as AUIProps } from "@assistant-ui/react-markdown";
import { cn } from "@/lib/utils";

type HighlighterProps = Omit<ShikiHighlighterProps, "children" | "theme"> & {
  theme?: ShikiHighlighterProps["theme"];
} & Pick<AUIProps, "node" | "components" | "language" | "code">;

export const SyntaxHighlighter: FC<HighlighterProps> = ({
  code,
  language,
  theme = { dark: "github-dark", light: "github-light" },
  className,
  addDefaultStyles = false,
  showLanguage = false,
  node: _node,
  components: _components,
  ...props
}) => {
  return (
    <ShikiHighlighter
      {...props}
      language={language}
      theme={theme}
      addDefaultStyles={addDefaultStyles}
      showLanguage={showLanguage}
      defaultColor="light-dark()"
      className={cn(
        "[&_pre]:overflow-x-auto [&_pre]:rounded-b-lg [&_pre]:bg-muted/50 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm",
        className,
      )}
    >
      {code.trim()}
    </ShikiHighlighter>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";

type FileHighlighterProps = {
  code: string;
  language?: string;
  className?: string;
};

export const FileHighlighter: FC<FileHighlighterProps> = ({
  code,
  language = "text",
  className,
}) => {
  return (
    <ShikiHighlighter
      language={language}
      theme={{ dark: "github-dark", light: "github-light" }}
      addDefaultStyles={false}
      showLanguage={false}
      defaultColor="light-dark()"
      className={cn(
        "[&_code]:wrap-break-word [&_code]:whitespace-pre-wrap [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0",
        className,
      )}
    >
      {code}
    </ShikiHighlighter>
  );
};

FileHighlighter.displayName = "FileHighlighter";
