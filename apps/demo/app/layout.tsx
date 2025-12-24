import type { Metadata } from "next";
import { geistSans, geistMono } from "@/styles/font";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import RootProvider from "@/app/provider";

export const metadata: Metadata = {
  title: {
    default: "assistant-ui demo",
    template: "%s | assistant-ui",
  },
  description: "AI chat experience built with assistant-ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(geistSans.className, geistMono.variable, "antialiased")}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
