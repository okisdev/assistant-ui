"use client";

import { useCallback, useState, type FC } from "react";
import {
  X,
  Sparkles,
  FileText,
  Image as ImageIcon,
  FileCode,
  File,
  Copy,
  Check,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  useSidePanel,
  type FilePreviewContent,
} from "@/lib/side-panel-context";
import { ArtifactRenderer } from "./artifact-renderer";
import { FilePreviewRenderer } from "./file-preview-renderer";

const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) {
    const subtype = mimeType.split("/")[1]?.toUpperCase();
    return subtype || "Image";
  }
  if (mimeType.startsWith("text/")) {
    const subtype = mimeType.split("/")[1];
    if (subtype === "plain") return "Text";
    if (subtype === "markdown") return "Markdown";
    if (subtype === "csv") return "CSV";
    if (subtype === "html") return "HTML";
    return subtype?.toUpperCase() || "Text";
  }
  if (mimeType === "application/json") return "JSON";
  if (mimeType === "application/xml") return "XML";
  return mimeType.split("/")[1]?.toUpperCase() || "File";
};

const getFileIcon = (mimeType: string) => {
  if (mimeType === "application/pdf") {
    return <FileText className="size-4 text-muted-foreground" />;
  }
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="size-4 text-muted-foreground" />;
  }
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  ) {
    return <FileCode className="size-4 text-muted-foreground" />;
  }
  return <File className="size-4 text-muted-foreground" />;
};

type FileActionsProps = {
  content: FilePreviewContent;
  textContent?: string | null;
};

const FileActions: FC<FileActionsProps> = ({ content, textContent }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!textContent) return;
    try {
      await navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  }, [textContent]);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = content.url;
    a.download = content.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [content.url, content.title]);

  const handleOpenInNewTab = useCallback(() => {
    window.open(content.url, "_blank", "noopener,noreferrer");
  }, [content.url]);

  const isText =
    content.mimeType.startsWith("text/") ||
    content.mimeType === "application/json" ||
    content.mimeType === "application/xml";

  return (
    <div className="flex items-center gap-1">
      {isText && textContent && (
        <button
          type="button"
          onClick={handleCopy}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Copy content"
        >
          {isCopied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={handleOpenInNewTab}
        className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Open in new tab"
      >
        <ExternalLink className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Download"
      >
        <Download className="size-3.5" />
      </button>
    </div>
  );
};

export const SidePanel: FC = () => {
  const { content, isOpen, closePanel } = useSidePanel();
  const [textContent, setTextContent] = useState<string | null>(null);

  if (!isOpen || !content) {
    return null;
  }

  const handleClose = () => {
    closePanel();
  };

  const renderHeader = () => {
    if (content.type === "artifact") {
      return (
        <>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
              <Sparkles className="size-4 text-muted-foreground" />
            </div>
            <h2 className="truncate font-medium text-sm">{content.title}</h2>
          </div>
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={handleClose}
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </>
      );
    }

    const fileTypeLabel = getFileTypeLabel(content.mimeType);
    const fileSizeLabel = formatFileSize(content.fileSize);

    return (
      <>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
            {getFileIcon(content.mimeType)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-medium text-sm">{content.title}</h2>
            <p className="truncate text-muted-foreground text-xs">
              {fileTypeLabel}
              {fileSizeLabel && ` · ${fileSizeLabel}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <FileActions content={content} textContent={textContent} />
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={handleClose}
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex shrink-0 items-center justify-between gap-3 bg-background/80 px-4 py-3 backdrop-blur-sm">
        {renderHeader()}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-4">
        {content.type === "artifact" && (
          <ArtifactRenderer
            title={content.title}
            content={content.content}
            type={content.artifactType}
            showHeader={false}
          />
        )}
        {content.type === "file-preview" && (
          <FilePreviewRenderer
            url={content.url}
            mimeType={content.mimeType}
            onTextContentLoad={setTextContent}
          />
        )}
      </div>
    </div>
  );
};
