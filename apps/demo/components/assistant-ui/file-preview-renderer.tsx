"use client";

import { useEffect, useState, type FC } from "react";
import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileHighlighter } from "./shiki-syntax-highlighter";

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

const getLanguageFromMime = (mimeType: string): string => {
  const mapping: Record<string, string> = {
    "text/plain": "text",
    "text/markdown": "markdown",
    "text/csv": "csv",
    "text/html": "html",
    "text/css": "css",
    "text/javascript": "javascript",
    "text/typescript": "typescript",
    "application/json": "json",
    "application/xml": "xml",
  };
  return mapping[mimeType] || "text";
};

export const FilePreviewRenderer: FC<FilePreviewRendererProps> = ({
  url,
  mimeType,
  onTextContentLoad,
}) => {
  const category = getFileCategory(mimeType);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  const language = getLanguageFromMime(mimeType);

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
            <div className="absolute inset-0 overflow-auto bg-muted/30 p-4 font-mono text-xs">
              <FileHighlighter code={textContent} language={language} />
            </div>
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
