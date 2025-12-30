export type DeviceType = "desktop" | "mobile" | "tablet";

export function parseUserAgent(userAgent: string | null | undefined): {
  browser: string;
  os: string;
  device: DeviceType;
} {
  if (!userAgent) {
    return { browser: "Unknown", os: "Unknown", device: "desktop" };
  }

  const ua = userAgent.toLowerCase();

  let browser = "Unknown";
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  let device: DeviceType = "desktop";
  if (ua.includes("mobile")) device = "mobile";
  else if (ua.includes("tablet") || ua.includes("ipad")) device = "tablet";

  return { browser, os, device };
}
