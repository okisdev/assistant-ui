import type { Metadata } from "next";
import { geistSans, geistMono } from "@/styles/font";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "assistant-ui demo",
  description: "assistant-ui demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(geistSans.className, geistMono.variable, "antialiased")}
      >
        {children}
      </body>
    </html>
  );
}
