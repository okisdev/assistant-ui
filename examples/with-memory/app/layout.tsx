import type { Metadata } from "next";
import { MyRuntimeProvider } from "@/app/MyRuntimeProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "assistant-ui with Memory",
  description: "Example of assistant-ui with memory feature",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MyRuntimeProvider>
      <html lang="en" className="h-dvh">
        <body className="h-dvh font-sans">{children}</body>
      </html>
    </MyRuntimeProvider>
  );
}
