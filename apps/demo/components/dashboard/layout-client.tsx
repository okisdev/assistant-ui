"use client";

import type { ReactNode } from "react";
import { ChatProvider } from "@/app/(app)/(chat)/provider";
import { AppLayout } from "@/components/shared/app-layout";
import { TRPCReady } from "@/utils/trpc/client";

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  return (
    <TRPCReady>
      <ChatProvider>
        <AppLayout>{children}</AppLayout>
      </ChatProvider>
    </TRPCReady>
  );
}
