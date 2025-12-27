"use client";

import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { SafeContentFrame, type RenderedFrame } from "safe-content-frame";
import { Loader2, Maximize2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type MCPAppRendererProps = {
  html: string;
  title?: string;
  minHeight?: number;
  className?: string;
  onExpand?: () => void;
};

export const MCPAppRenderer: FC<MCPAppRendererProps> = ({
  html,
  title = "MCP App",
  minHeight = 200,
  className,
  onExpand,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<RenderedFrame | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(minHeight);
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "resize" &&
        typeof event.data.height === "number"
      ) {
        setHeight(Math.max(event.data.height, minHeight));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [minHeight]);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "theme-change", theme: resolvedTheme },
        "*",
      );
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html) return;

    let aborted = false;
    let currentFrame: RenderedFrame | null = null;

    const renderContent = async () => {
      try {
        setIsLoading(true);
        setRenderError(null);

        if (frameRef.current) {
          frameRef.current.dispose();
          frameRef.current = null;
        }

        container.innerHTML = "";

        const scf = new SafeContentFrame("mcp-apps", {
          sandbox: ["allow-scripts", "allow-forms"],
        });

        let htmlContent = html;
        if (!html.includes("data-theme")) {
          htmlContent = html.replace(
            "<html",
            `<html data-theme="${resolvedTheme}"`,
          );
        }

        currentFrame = await scf.renderHtml(htmlContent, container);

        if (!aborted) {
          frameRef.current = currentFrame;
          const iframe = container.querySelector("iframe");
          if (iframe) {
            iframeRef.current = iframe;
            iframe.contentWindow?.postMessage(
              { type: "theme-change", theme: resolvedTheme },
              "*",
            );
          }
          setIsLoading(false);
        } else {
          currentFrame.dispose();
        }
      } catch (error) {
        if (!aborted) {
          setRenderError(
            error instanceof Error ? error.message : "Failed to render MCP App",
          );
          setIsLoading(false);
        }
      }
    };

    renderContent();

    return () => {
      aborted = true;
      if (frameRef.current) {
        frameRef.current.dispose();
        frameRef.current = null;
      }
    };
  }, [html, resolvedTheme]);

  const handleExpand = useCallback(() => {
    onExpand?.();
  }, [onExpand]);

  if (renderError) {
    return (
      <div className={cn("rounded-xl bg-muted/30 p-4", className)}>
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <p className="font-medium text-destructive text-sm">
            Failed to render
          </p>
          <p className="text-muted-foreground text-xs">{renderError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/30",
        className,
      )}
    >
      {onExpand && (
        <button
          type="button"
          onClick={handleExpand}
          className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity hover:text-foreground group-hover:opacity-100"
          aria-label="Expand"
        >
          <Maximize2 className="size-3.5" />
        </button>
      )}

      {isLoading && (
        <div
          className="flex items-center justify-center"
          style={{ height: minHeight }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-xs">Loading {title}...</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "w-full overflow-hidden transition-[height] duration-200",
          isLoading && "hidden",
        )}
        style={{ height }}
      />
    </div>
  );
};
