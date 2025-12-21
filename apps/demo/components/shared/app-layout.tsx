"use client";

import type { ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
};

function AppLayoutContent({
  children,
  headerLeft,
  headerRight,
}: AppLayoutProps) {
  const { state } = useSidebar();
  const hasHeader = headerLeft || headerRight;

  return (
    <SidebarInset className="relative h-svh min-h-svh w-[calc(100dvw-var(--sidebar-width))] overflow-hidden">
      <header
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 flex h-12 items-center gap-2 px-4",
          hasHeader && "pointer-events-auto",
        )}
      >
        <SidebarTrigger
          className={cn(
            "pointer-events-auto -ml-1 transition-all duration-200",
            state === "collapsed"
              ? "w-7 opacity-100"
              : "w-0 overflow-hidden opacity-0",
          )}
        />
        {headerLeft && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {headerLeft}
          </div>
        )}
        {headerRight && (
          <div className="ml-auto flex items-center gap-2">{headerRight}</div>
        )}
      </header>
      <main className="flex h-full min-h-0 flex-1 flex-col">{children}</main>
    </SidebarInset>
  );
}

export function AppLayout({
  children,
  headerLeft,
  headerRight,
}: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AppLayoutContent headerLeft={headerLeft} headerRight={headerRight}>
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  );
}
