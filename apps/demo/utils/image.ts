import { getDomain } from "tldts";

export function getFaviconUrl(url: string): string {
  try {
    const domain = getDomain(url);
    if (!domain) return "";
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return "";
  }
}
