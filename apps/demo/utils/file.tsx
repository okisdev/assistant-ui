"use client";

import { FileText, FileCode, File, Image as ImageIcon } from "lucide-react";

export const getFileIcon = (mimeType: string) => {
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

export const getFileTypeLabel = (mimeType: string): string => {
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

export const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
