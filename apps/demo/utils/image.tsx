"use client";

import { useState, useMemo, type ComponentProps } from "react";
import { getDomain, getHostname } from "tldts";

function getFaviconUrls(url: string): string[] {
  try {
    const hostname = getHostname(url);
    const domain = getDomain(url);

    if (!hostname && !domain) return [];

    const urls: string[] = [];

    if (hostname) {
      urls.push(`https://icons.duckduckgo.com/ip3/${hostname}.ico`);
    }

    if (domain && domain !== hostname) {
      urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    }

    return urls;
  } catch {
    return [];
  }
}

type FaviconImageProps = Omit<ComponentProps<"img">, "src" | "onError"> & {
  url: string;
  fallback?: React.ReactNode;
};

export function FaviconImage({ url, fallback, ...props }: FaviconImageProps) {
  const faviconUrls = useMemo(() => getFaviconUrls(url), [url]);
  const [index, setIndex] = useState(0);

  const currentUrl = faviconUrls[index];

  if (!currentUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      alt=""
      {...props}
      src={currentUrl}
      onError={() => setIndex((prev) => prev + 1)}
    />
  );
}
