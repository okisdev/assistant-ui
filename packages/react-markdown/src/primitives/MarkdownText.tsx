"use client";

import { INTERNAL, useContentPartText } from "@assistant-ui/react";
import type { ComponentType, FC } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import { SyntaxHighlighterProps, CodeHeaderProps } from "../overrides/types";
import { PreOverride } from "../overrides/PreOverride";
import {
  DefaultPre,
  DefaultCode,
  DefaultSyntaxHighlighter,
  DefaultCodeHeader,
} from "../overrides/defaultComponents";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { CodeOverride } from "../overrides/CodeOverride";

const { useSmooth } = INTERNAL;

export type MarkdownTextPrimitiveProps = Omit<
  Options,
  "components" | "children"
> & {
  components?: NonNullable<Options["components"]> & {
    SyntaxHighlighter?: ComponentType<SyntaxHighlighterProps>;
    CodeHeader?: ComponentType<CodeHeaderProps>;
  };
  smooth?: boolean;
};
export const MarkdownTextPrimitive: FC<MarkdownTextPrimitiveProps> = ({
  smooth = true,
  components: userComponents,
  ...rest
}) => {
  const {
    part: { text },
  } = useContentPartText();
  const smoothText = useSmooth(text, smooth); // TODO loading indicator disappears before smooth animation ends

  const {
    pre = DefaultPre,
    code = DefaultCode,
    SyntaxHighlighter = DefaultSyntaxHighlighter,
    CodeHeader = DefaultCodeHeader,
    ...componentsRest
  } = userComponents ?? {};
  const components: typeof userComponents = {
    ...componentsRest,
    pre: PreOverride,
    code: useCallbackRef((props) => (
      <CodeOverride
        components={{ Pre: pre, Code: code, SyntaxHighlighter, CodeHeader }}
        {...props}
      />
    )),
  };

  return (
    <ReactMarkdown components={components} {...rest}>
      {smoothText}
    </ReactMarkdown>
  );
};
