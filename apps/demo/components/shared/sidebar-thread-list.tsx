"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Plus,
  Archive,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Trash2,
  ArchiveRestore,
  Pencil,
} from "lucide-react";
import {
  AssistantIf,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAssistantApi,
  useAssistantState,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const SidebarThreadListNew: FC = () => {
  const router = useRouter();
  const api = useAssistantApi();

  const handleNewChat = () => {
    api.threads().switchToNewThread();
    router.push("/");
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleNewChat} tooltip="New Chat">
              <Plus />
              <span>New Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export const SidebarThreadList: FC = () => {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup className="flex-1 overflow-y-auto group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center">
            Conversations
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
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
            <AssistantIf
              condition={({ threads }) =>
                !threads.isLoading && threads.threadIds.length > 0
              }
            >
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href="/chats"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <span>View all</span>
                      <ChevronRight className="ml-auto" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </AssistantIf>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
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
  const router = useRouter();
  const api = useAssistantApi();
  const remoteId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );
  const title = useAssistantState(({ threadListItem }) => threadListItem.title);
  const isArchived = useAssistantState(
    ({ threadListItem }) => threadListItem.status === "archived",
  );

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    api.threadListItem().switchTo();
    if (remoteId) {
      router.push(`/chat/${remoteId}`);
    }
  };

  const handleRenameOpen = () => {
    setRenameValue(title || "New Chat");
    setRenameOpen(true);
  };

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title) {
      api.threadListItem().rename(trimmed);
    }
    setRenameOpen(false);
  };

  if (!remoteId) return null;

  return (
    <SidebarMenuItem>
      <ThreadListItemPrimitive.Root className="group/item flex h-8 w-full items-center rounded-md text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground">
        <Link
          href={`/chat/${remoteId}`}
          onClick={handleClick}
          className="flex h-full flex-1 items-center truncate px-2"
        >
          <ThreadListItemPrimitive.Title fallback="New Chat" />
        </Link>
        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mr-1 size-6 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-hover/item:opacity-100 data-[state=open]:bg-sidebar-accent data-[state=open]:opacity-100"
                  aria-label="Thread options"
                >
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={handleRenameOpen}>
                    <Pencil className="size-4" />
                    Rename
                  </DropdownMenuItem>
                </DialogTrigger>
                {isArchived ? (
                  <ThreadListItemPrimitive.Unarchive asChild>
                    <DropdownMenuItem>
                      <ArchiveRestore className="size-4" />
                      Restore
                    </DropdownMenuItem>
                  </ThreadListItemPrimitive.Unarchive>
                ) : (
                  <ThreadListItemPrimitive.Archive asChild>
                    <DropdownMenuItem>
                      <Archive className="size-4" />
                      Archive
                    </DropdownMenuItem>
                  </ThreadListItemPrimitive.Archive>
                )}
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  chat and all its messages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <ThreadListItemPrimitive.Delete asChild>
                  <AlertDialogAction>Delete</AlertDialogAction>
                </ThreadListItemPrimitive.Delete>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename chat</DialogTitle>
            </DialogHeader>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
              placeholder="Chat title"
              autoFocus
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleRename}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ThreadListItemPrimitive.Root>
    </SidebarMenuItem>
  );
};
