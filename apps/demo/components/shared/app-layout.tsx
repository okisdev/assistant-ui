"use client";

import type { ReactNode } from "react";
import { Ghost } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { useIncognitoOptional } from "@/contexts/incognito-provider";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
};

function IncognitoIndicator() {
  return (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-1">
      <Ghost className="size-3.5 text-muted-foreground" />
      <span className="font-medium text-muted-foreground text-xs">
        Incognito
      </span>
    </div>
  );
}

function AppLayoutContent({
  children,
  headerLeft,
  headerRight,
}: AppLayoutProps) {
  const { state } = useSidebar();
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;
  const hasHeader = headerLeft || headerRight || isIncognito;

  return (
    <SidebarInset
      className={cn(
        "relative h-svh min-h-svh w-[calc(100dvw-var(--sidebar-width))] overflow-hidden",
        isIncognito && "bg-muted/30",
      )}
    >
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
        {isIncognito && <IncognitoIndicator />}
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
