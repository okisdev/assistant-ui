"use client";

import { useAssistantState } from "@assistant-ui/react";
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import { LoaderIcon } from "lucide-react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { type FC, useEffect, useRef, useState, useId } from "react";
import { cn } from "@/lib/utils";

export type MermaidDiagramProps = SyntaxHighlighterProps & {
  className?: string;
};

export const MermaidDiagram: FC<MermaidDiagramProps> = ({
  code,
  className,
  node: _node,
  components: _components,
  language: _language,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uniqueId = useId().replace(/:/g, "-");

  const isComplete = useAssistantState(({ part }) => {
    if (part.type !== "text") return false;

    const codeIndex = part.text.indexOf(code);
    if (codeIndex === -1) return false;

    const afterCode = part.text.substring(codeIndex + code.length);
    const closingBackticksMatch = afterCode.match(/^```|^\n```/);
    return closingBackticksMatch !== null;
  });

  useEffect(() => {
    if (!isComplete) return;

    let cancelled = false;
    const mermaidTheme = resolvedTheme === "dark" ? "dark" : "default";

    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      themeVariables:
        resolvedTheme === "dark"
          ? {
              background: "transparent",
              primaryColor: "#3b82f6",
              primaryTextColor: "#e5e7eb",
              primaryBorderColor: "#4b5563",
              lineColor: "#6b7280",
              secondaryColor: "#1f2937",
              tertiaryColor: "#374151",
            }
          : undefined,
    });

    (async () => {
      try {
        const id = `mermaid-${uniqueId}-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("Failed to render Mermaid diagram:", e);
          setError("Failed to render diagram");
          setSvgContent(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isComplete, code, resolvedTheme, uniqueId]);

  if (!isComplete) {
    return (
      <div
        className={cn(
          "mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-4 text-muted-foreground",
          className,
        )}
      >
        <LoaderIcon className="size-4 animate-spin" />
        <span className="shimmer text-sm">Drawing diagram...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "mt-4 rounded-lg bg-destructive/10 p-4 text-center text-destructive text-sm",
          className,
        )}
      >
        {error}
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div
        className={cn(
          "mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-4 text-muted-foreground",
          className,
        )}
      >
        <LoaderIcon className="size-4 animate-spin" />
        <span className="shimmer text-sm">Rendering...</span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "mt-4 overflow-x-auto rounded-lg bg-muted/50 p-4 text-center [&_svg]:mx-auto",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

MermaidDiagram.displayName = "MermaidDiagram";
