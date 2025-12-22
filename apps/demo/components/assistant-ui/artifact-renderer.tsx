"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { SafeContentFrame, type RenderedFrame } from "safe-content-frame";
import { highlight } from "sugar-high";
import { Copy, Check, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ArtifactRendererProps = {
  title: string;
  content: string;
  type?: "html" | "react" | "svg";
  isLoading?: boolean;
  showHeader?: boolean;
};

export const ArtifactRenderer: FC<ArtifactRendererProps> = ({
  title,
  content,
  type = "html",
  isLoading = false,
  showHeader = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<RenderedFrame | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isCopied, setIsCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab("preview");
  }, [content]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !content || activeTab !== "preview" || isLoading) return;

    let aborted = false;
    let currentFrame: RenderedFrame | null = null;

    const renderContent = async () => {
      try {
        setRenderError(null);

        if (frameRef.current) {
          frameRef.current.dispose();
          frameRef.current = null;
        }

        container.innerHTML = "";

        const scf = new SafeContentFrame("demo-artifacts", {
          sandbox: ["allow-scripts", "allow-forms"],
        });

        let htmlContent = content;

        if (type === "svg") {
          htmlContent = `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}</style></head><body>${content}</body></html>`;
        } else if (
          !content.includes("<!DOCTYPE") &&
          !content.includes("<html")
        ) {
          htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:16px;}</style></head><body>${content}</body></html>`;
        }

        currentFrame = await scf.renderHtml(htmlContent, container);

        if (!aborted) {
          frameRef.current = currentFrame;
        } else {
          currentFrame.dispose();
        }
      } catch (error) {
        if (!aborted) {
          setRenderError(
            error instanceof Error
              ? error.message
              : "Failed to render artifact",
          );
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
  }, [content, type, activeTab, isLoading]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  }, [content]);

  const handleDownload = useCallback(() => {
    const extension = type === "svg" ? "svg" : "html";
    const mimeType = type === "svg" ? "image/svg+xml" : "text/html";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, title, type]);

  const highlightedCode = useMemo(() => {
    if (!content) return "";
    try {
      const result = highlight(content);
      return result || content;
    } catch {
      return content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [content]);

  const TabsComponent = (
    <div className="flex items-center gap-1 rounded-full bg-muted/50 p-0.5">
      <button
        type="button"
        onClick={() => setActiveTab("preview")}
        className={cn(
          "rounded-full px-3 py-1 font-medium text-xs transition-colors",
          activeTab === "preview"
            ? "bg-background text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Preview
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("code")}
        className={cn(
          "rounded-full px-3 py-1 font-medium text-xs transition-colors",
          activeTab === "code"
            ? "bg-background text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Code
      </button>
    </div>
  );

  const ActionsComponent = (
    <div className="flex items-center gap-1 text-muted-foreground">
      <button
        type="button"
        onClick={handleCopy}
        className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground"
      >
        {isCopied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground"
      >
        <Download className="size-3.5" />
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-muted/50">
      {showHeader && (
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{title}</span>
            {isLoading && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {TabsComponent}
          {ActionsComponent}
        </div>
      )}

      {!showHeader && (
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
          {TabsComponent}
          {ActionsComponent}
        </div>
      )}

      <div className="relative min-h-64 flex-1">
        {isLoading ? (
          <div className="flex h-full min-h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Generating artifact...</span>
            </div>
          </div>
        ) : activeTab === "preview" ? (
          renderError ? (
            <div className="flex h-full min-h-64 items-center justify-center p-4">
              <div className="text-center text-destructive text-sm">
                <p className="font-medium">Failed to render</p>
                <p className="mt-1 text-muted-foreground">{renderError}</p>
              </div>
            </div>
          ) : (
            <div ref={containerRef} className="h-full min-h-64 bg-white" />
          )
        ) : (
          <pre className="absolute inset-0 overflow-auto bg-muted/30 p-4 font-mono text-xs">
            <code
              className="block"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        )}
      </div>
    </div>
  );
};
