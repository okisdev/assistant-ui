"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  SidebarThreadList,
  SidebarThreadListNew,
} from "@/components/assistant-ui/sidebar-thread-list";
import { SidebarUserMenu } from "@/components/shared/sidebar-user-menu";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center justify-between">
              <SidebarMenuButton size="default" asChild className="flex-1">
                <Link href="/" className="flex items-center gap-2">
                  <MessagesSquare className="size-4" />
                  <span className="truncate font-medium">
                    assistant-ui demo
                  </span>
                </Link>
              </SidebarMenuButton>
              <SidebarTrigger className="w-8 shrink-0 opacity-100 transition-all duration-200 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarThreadListNew />
        <SidebarThreadList />
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
