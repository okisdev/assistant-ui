"use client";

import { type ComponentType, type FC, Fragment } from "react";
import { useMessageSources } from "./useMessageSources";
import type { SourceMessagePart } from "../../types";

export type SourceListItemProps = SourceMessagePart & {
  /** 1-based index for display */
  index: number;
};

export type SourceListItemComponent = ComponentType<SourceListItemProps>;

const DefaultSourceListItem: SourceListItemComponent = ({
  url,
  title,
  index,
}) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    style={{ display: "block" }}
  >
    [{index}] {title ?? url}
  </a>
);

export namespace MessagePrimitiveSourceList {
  export type Props = {
    /** Custom component to render each source item */
    SourceListItem?: SourceListItemComponent;
  };
}

/**
 * Renders a list of all source citations in the current message.
 *
 * @example
 * ```tsx
 * <MessagePrimitive.Root>
 *   <MessagePrimitive.Parts components={{ Text: MyText }} />
 *   <MessagePrimitive.SourceList />
 * </MessagePrimitive.Root>
 * ```
 *
 * @example Custom source item
 * ```tsx
 * <MessagePrimitive.SourceList
 *   SourceListItem={({ url, title, index, snippet }) => (
 *     <div>
 *       <a href={url}>[{index}] {title}</a>
 *       {snippet && <p>{snippet}</p>}
 *     </div>
 *   )}
 * />
 * ```
 */
export const MessagePrimitiveSourceList: FC<
  MessagePrimitiveSourceList.Props
> = ({ SourceListItem = DefaultSourceListItem }) => {
  const sources = useMessageSources();

  if (sources.length === 0) return null;

  return (
    <Fragment>
      {sources.map((source, i) => (
        <SourceListItem
          key={source.id}
          {...source}
          index={source.citationIndex ?? i + 1}
        />
      ))}
    </Fragment>
  );
};

MessagePrimitiveSourceList.displayName = "MessagePrimitive.SourceList";
