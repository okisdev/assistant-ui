"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { cn } from "@/lib/utils";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();

  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center px-4">
        <SidebarTrigger
          className={cn(
            "-ml-1 transition-opacity duration-200",
            state === "collapsed"
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
        />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </SidebarInset>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
