"use client";

import type { ReactNode } from "react";
import { ChatProvider } from "@/app/(app)/(chat)/provider";
import { AppLayout } from "@/components/shared/app-layout";

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <AppLayout>{children}</AppLayout>
    </ChatProvider>
  );
}
