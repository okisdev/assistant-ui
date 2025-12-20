"use client";

import { Plus, Archive } from "lucide-react";
import {
  AssistantIf,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export const SidebarThreadListNew: FC = () => {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <ThreadListPrimitive.Root>
          <SidebarMenu>
            <SidebarMenuItem>
              <ThreadListPrimitive.New asChild>
                <SidebarMenuButton>
                  <Plus />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </ThreadListPrimitive.New>
            </SidebarMenuItem>
          </SidebarMenu>
        </ThreadListPrimitive.Root>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export const SidebarThreadList: FC = () => {
  return (
    <SidebarGroup className="flex-1 overflow-y-auto">
      <SidebarGroupLabel>Conversations</SidebarGroupLabel>
      <SidebarGroupContent>
        <ThreadListPrimitive.Root className="flex flex-col">
          <AssistantIf condition={({ threads }) => threads.isLoading}>
            <ThreadListSkeleton />
          </AssistantIf>
          <AssistantIf
            condition={({ threads }) =>
              !threads.isLoading && threads.threadIds.length === 0
            }
          >
            <ThreadListEmpty />
          </AssistantIf>
          <AssistantIf
            condition={({ threads }) =>
              !threads.isLoading && threads.threadIds.length > 0
            }
          >
            <SidebarMenu>
              <ThreadListPrimitive.Items
                components={{ ThreadListItem: SidebarThreadListItem }}
              />
            </SidebarMenu>
          </AssistantIf>
        </ThreadListPrimitive.Root>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const ThreadListSkeleton: FC = () => {
  return (
    <SidebarMenu>
      {Array.from({ length: 5 }, (_, i) => (
        <SidebarMenuItem key={i}>
          <div className="flex h-8 items-center px-2">
            <Skeleton className="h-4 w-full" />
          </div>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};

const ThreadListEmpty: FC = () => {
  return (
    <div className="px-2 py-4 text-center text-muted-foreground text-sm">
      No conversations yet
    </div>
  );
};

const SidebarThreadListItem: FC = () => {
  return (
    <SidebarMenuItem>
      <ThreadListItemPrimitive.Root className="group/item flex h-8 w-full items-center rounded-md text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground">
        <ThreadListItemPrimitive.Trigger className="flex h-full flex-1 items-center truncate px-2">
          <ThreadListItemPrimitive.Title fallback="New Chat" />
        </ThreadListItemPrimitive.Trigger>
        <ThreadListItemPrimitive.Archive asChild>
          <button
            type="button"
            className="mr-1 size-6 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-hover/item:opacity-100"
            aria-label="Archive thread"
          >
            <Archive className="size-4" />
          </button>
        </ThreadListItemPrimitive.Archive>
      </ThreadListItemPrimitive.Root>
    </SidebarMenuItem>
  );
};
