"use client";

import {
  type ComponentType,
  type FC,
  type ReactNode,
  useState,
  createContext,
  useContext,
} from "react";
import type { SourceMessagePart } from "@assistant-ui/react";

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

export type CitationTooltipProps = {
  source: SourceMessagePart;
  index: number;
  children: ReactNode;
};

export type CitationTooltipComponent = ComponentType<CitationTooltipProps>;

// Context to provide sources to CitationLink
const CitationSourcesContext = createContext<readonly SourceMessagePart[]>([]);

export const CitationSourcesProvider: FC<{
  sources: readonly SourceMessagePart[];
  children: ReactNode;
}> = ({ sources, children }) => (
  <CitationSourcesContext.Provider value={sources}>
    {children}
  </CitationSourcesContext.Provider>
);

/**
 * Default tooltip that shows on hover.
 * Users can override this with their own implementation (e.g., using Radix Popover).
 */
const DefaultCitationTooltip: CitationTooltipComponent = ({
  source,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <span
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            backgroundColor: "var(--aui-citation-tooltip-bg, #1a1a1a)",
            color: "var(--aui-citation-tooltip-color, #fff)",
            borderRadius: "6px",
            fontSize: "0.875rem",
            whiteSpace: "nowrap",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            marginBottom: "4px",
          }}
        >
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            {source.title ?? source.url}
          </a>
          {source.snippet && (
            <span
              style={{
                display: "block",
                marginTop: "4px",
                opacity: 0.8,
                maxWidth: "300px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {source.snippet}
            </span>
          )}
        </span>
      )}
    </span>
  );
};

// Context for custom tooltip component
const CitationTooltipContext = createContext<CitationTooltipComponent>(
  DefaultCitationTooltip,
);

export const CitationTooltipProvider: FC<{
  component: CitationTooltipComponent;
  children: ReactNode;
}> = ({ component, children }) => (
  <CitationTooltipContext.Provider value={component}>
    {children}
  </CitationTooltipContext.Provider>
);

/**
 * Component to render inline citation links with hover tooltips.
 * Use this as the `cite` component in MarkdownTextPrimitive.
 *
 * @example Basic usage
 * ```tsx
 * const sources = useMessageSources();
 *
 * <CitationSourcesProvider sources={sources}>
 *   <MarkdownTextPrimitive
 *     preprocess={(text) => preprocessCitations(text, sources)}
 *     components={{
 *       cite: CitationLink,
 *     }}
 *   />
 * </CitationSourcesProvider>
 * ```
 *
 * @example With custom tooltip
 * ```tsx
 * <CitationSourcesProvider sources={sources}>
 *   <CitationTooltipProvider component={MyCustomTooltip}>
 *     <MarkdownTextPrimitive
 *       preprocess={(text) => preprocessCitations(text, sources)}
 *       components={{ cite: CitationLink }}
 *     />
 *   </CitationTooltipProvider>
 * </CitationSourcesProvider>
 * ```
 */
export const CitationLink: FC<CitationLinkProps> = ({
  "data-source-id": sourceId,
  "data-source-index": sourceIndexStr,
  children,
}) => {
  const sources = useContext(CitationSourcesContext);
  const TooltipComponent = useContext(CitationTooltipContext);

  const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : 0;
  const source = sourceId
    ? sources.find((s) => s.id === sourceId)
    : sources[sourceIndex - 1];

  if (!source) {
    // Fallback: render as plain text if source not found
    return <sup>[{children}]</sup>;
  }

  return (
    <TooltipComponent source={source} index={sourceIndex}>
      <sup
        style={{
          cursor: "pointer",
          color: "var(--aui-citation-link-color, #0066cc)",
          fontWeight: 500,
        }}
      >
        [{children}]
      </sup>
    </TooltipComponent>
  );
};

CitationLink.displayName = "CitationLink";
