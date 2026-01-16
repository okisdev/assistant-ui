"use client";

import {
  memo,
  type FC,
  type ReactNode,
  createContext,
  useContext,
} from "react";
import { useMessageSources, type SourceMessagePart } from "@assistant-ui/react";
import {
  preprocessCitations,
  type PreprocessCitationsOptions,
} from "@assistant-ui/react-markdown";
import { ExternalLinkIcon } from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

// ============================================================================
// Context
// ============================================================================

const CitationSourcesContext = createContext<readonly SourceMessagePart[]>([]);

/**
 * Provider to make sources available to CitationLink components.
 */
export const CitationSourcesProvider: FC<{
  sources: readonly SourceMessagePart[];
  children: ReactNode;
}> = ({ sources, children }) => (
  <CitationSourcesContext.Provider value={sources}>
    {children}
  </CitationSourcesContext.Provider>
);

// ============================================================================
// CitationLink Component
// ============================================================================

export type CitationLinkProps = {
  /** Source ID from data-source-id attribute */
  "data-source-id"?: string;
  /** Citation index from data-source-index attribute */
  "data-source-index"?: string;
  /** Children (the citation number) */
  children?: ReactNode;
  /** AST node (passed by react-markdown) */
  node?: unknown;
};

/**
 * Inline citation link with hover card preview.
 * Use as a custom component for `<cite>` elements in MarkdownTextPrimitive.
 *
 * @example
 * ```tsx
 * const sources = useMessageSources();
 *
 * <CitationSourcesProvider sources={sources}>
 *   <MarkdownTextPrimitive
 *     preprocess={(text) => makeCitationPreprocessor(sources)(text)}
 *     components={{ cite: CitationLink }}
 *   />
 * </CitationSourcesProvider>
 * ```
 */
const CitationLinkImpl: FC<CitationLinkProps> = ({
  "data-source-id": sourceId,
  "data-source-index": sourceIndexStr,
  children,
}) => {
  const sources = useContext(CitationSourcesContext);
  const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : 0;
  const source = sourceId
    ? sources.find((s) => s.id === sourceId)
    : sources[sourceIndex - 1];

  if (!source) {
    return (
      <sup className="aui-citation-link text-muted-foreground">
        [{children}]
      </sup>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <sup className="aui-citation-link cursor-pointer font-medium text-primary hover:underline">
          [{children}]
        </sup>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        className="aui-citation-hover-card w-80"
      >
        <div className="flex flex-col gap-2">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium text-sm hover:underline"
          >
            <span className="line-clamp-1">{source.title ?? source.url}</span>
            <ExternalLinkIcon className="size-3 shrink-0" />
          </a>
          {source.snippet && (
            <p className="line-clamp-3 text-muted-foreground text-xs">
              {source.snippet}
            </p>
          )}
          <span className="text-muted-foreground/60 text-xs">
            {new URL(source.url).hostname}
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export const CitationLink = memo(CitationLinkImpl);
CitationLink.displayName = "CitationLink";

// ============================================================================
// SourceList Component
// ============================================================================

export type SourceListItemProps = SourceMessagePart & {
  /** 1-based index for display */
  index: number;
};

/**
 * Default source list item component.
 */
const DefaultSourceListItem: FC<SourceListItemProps> = ({
  url,
  title,
  index,
  snippet,
}) => {
  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="aui-source-list-item group flex cursor-default select-none items-start gap-2.5 rounded-lg px-3 py-2 text-muted-foreground text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted font-medium text-xs">
        {index}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-1 font-medium text-foreground group-hover:text-accent-foreground">
          {title ?? url}
        </span>
        {snippet && (
          <span className="line-clamp-2 text-xs opacity-80">{snippet}</span>
        )}
        <span className="text-xs opacity-60">{hostname}</span>
      </div>
      <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0 opacity-50" />
    </a>
  );
};

export type SourceListProps = {
  /** Custom component to render each source item */
  SourceListItem?: FC<SourceListItemProps>;
  /** Additional className */
  className?: string;
};

/**
 * Renders a list of all source citations in the current message.
 *
 * @example
 * ```tsx
 * <MessagePrimitive.Root>
 *   <MessagePrimitive.Parts components={{ Text: MyText }} />
 *   <SourceList />
 * </MessagePrimitive.Root>
 * ```
 */
const SourceListImpl: FC<SourceListProps> = ({
  SourceListItem = DefaultSourceListItem,
  className,
}) => {
  const sources = useMessageSources();

  if (sources.length === 0) return null;

  return (
    <div className={cn("aui-source-list mt-4 flex flex-col gap-2", className)}>
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Sources
      </span>
      {sources.map((source, i) => (
        <SourceListItem
          key={source.id}
          {...source}
          index={source.citationIndex ?? i + 1}
        />
      ))}
    </div>
  );
};

export const SourceList = memo(SourceListImpl);
SourceList.displayName = "SourceList";

// ============================================================================
// Utility: Citation Preprocessor
// ============================================================================

/**
 * Creates a preprocess function for converting [1], [2] markers to cite elements.
 *
 * @example
 * ```tsx
 * const sources = useMessageSources();
 *
 * <MarkdownTextPrimitive
 *   preprocess={makeCitationPreprocessor(sources)}
 *   components={{ cite: CitationLink }}
 * />
 * ```
 */
export const makeCitationPreprocessor = (
  sources: readonly SourceMessagePart[],
  options?: PreprocessCitationsOptions,
) => {
  return (text: string) => preprocessCitations(text, sources, options);
};
