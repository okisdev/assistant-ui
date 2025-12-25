"use client";

import { useEffect, useMemo, useState, type FC } from "react";
import { highlight } from "sugar-high";
import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

type FilePreviewRendererProps = {
  url: string;
  mimeType: string;
  onTextContentLoad?: (content: string | null) => void;
};

const getFileCategory = (
  mimeType: string,
): "pdf" | "image" | "text" | "other" => {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  )
    return "text";
  return "other";
};

const getFileExtensionFromMime = (mimeType: string): string => {
  const mapping: Record<string, string> = {
    "text/plain": "txt",
    "text/markdown": "md",
    "text/csv": "csv",
    "text/html": "html",
    "text/css": "css",
    "text/javascript": "js",
    "application/json": "json",
    "application/xml": "xml",
  };
  return mapping[mimeType] || "";
};

export const FilePreviewRenderer: FC<FilePreviewRendererProps> = ({
  url,
  mimeType,
  onTextContentLoad,
}) => {
  const category = getFileCategory(mimeType);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    if (category === "text") {
      setIsLoadingText(true);
      fetch(url)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setIsLoadingText(false);
          onTextContentLoad?.(text);
        })
        .catch(() => {
          setTextContent(null);
          setIsLoadingText(false);
          onTextContentLoad?.(null);
        });
    }
  }, [url, category, onTextContentLoad]);

  const highlightedCode = useMemo(() => {
    if (!textContent) return "";
    const ext = getFileExtensionFromMime(mimeType);
    if (
      ["js", "ts", "tsx", "jsx", "json", "html", "css", "xml"].includes(ext)
    ) {
      try {
        return highlight(textContent);
      } catch {
        return textContent
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }
    }
    return textContent
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }, [textContent, mimeType]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-muted/50">
      <div className="relative min-h-64 flex-1">
        {category === "pdf" && (
          <iframe
            src={url}
            className="h-full w-full"
            title="PDF preview"
            style={{ border: "none" }}
          />
        )}

        {category === "image" && (
          <div className="flex h-full items-center justify-center bg-muted/30 p-4">
            <img
              src={url}
              alt="File preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {category === "text" &&
          (isLoadingText ? (
            <div className="flex h-full min-h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          ) : textContent ? (
            <pre className="absolute inset-0 overflow-auto bg-muted/30 p-4 font-mono text-xs">
              <code
                className="wrap-break-word block whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center p-4">
              <div className="text-center text-muted-foreground text-sm">
                <p>Failed to load file content</p>
              </div>
            </div>
          ))}

        {category === "other" && (
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Preview not available for this file type
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90",
              )}
            >
              <Download className="size-4" />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
