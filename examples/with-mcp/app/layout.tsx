import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Example",
  description: "Example using @assistant-ui/react with MCP tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-dvh">{children}</body>
    </html>
  );
}
