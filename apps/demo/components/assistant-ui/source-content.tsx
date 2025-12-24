"use client";

import { type FC, memo } from "react";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import type { SourceMessagePartProps } from "@assistant-ui/react";
import { cn } from "@/lib/utils";

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const getFaviconUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return "";
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
  const faviconUrl = getFaviconUrl(url);
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
      {faviconUrl ? (
        <img
          src={faviconUrl}
          alt=""
          width={14}
          height={14}
          className="size-3.5 shrink-0 rounded-sm"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      ) : null}
      <GlobeIcon
        className={cn("hidden size-3.5 shrink-0", !faviconUrl && "block!")}
      />
      <span className="max-w-[150px] truncate">{displayTitle}</span>
      <ExternalLinkIcon className="size-3 shrink-0 opacity-0 transition-opacity group-hover/source:opacity-100" />
    </a>
  );
};

export const SourceContent = memo(SourceContentImpl);
