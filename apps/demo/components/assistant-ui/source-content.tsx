"use client";

import { type FC, memo } from "react";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import type { SourceMessagePartProps } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import { FaviconImage } from "@/utils/image";

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const SourceContentImpl: FC<SourceMessagePartProps> = ({
  url,
  title,
  sourceType,
}) => {
  if (sourceType !== "url" || !url) {
    return null;
  }

  const domain = extractDomain(url);
  const displayTitle = title || domain;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group/source inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted",
        "text-muted-foreground hover:text-foreground",
      )}
    >
      <FaviconImage
        url={url}
        alt=""
        width={14}
        height={14}
        className="size-3.5 shrink-0 rounded-sm"
        fallback={<GlobeIcon className="size-3.5 shrink-0" />}
      />
      <span className="max-w-[150px] truncate">{displayTitle}</span>
      <ExternalLinkIcon className="size-3 shrink-0 opacity-0 transition-opacity group-hover/source:opacity-100" />
    </a>
  );
};

export const SourceContent = memo(SourceContentImpl);
