import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TanStack AI Example",
  description: "Example using @assistant-ui/react with TanStack AI",
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
