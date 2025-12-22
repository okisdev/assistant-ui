"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Archive,
  MoreVertical,
  Trash2,
  ArchiveRestore,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAssistantApi } from "@assistant-ui/react";

import { api } from "@/utils/trpc/client";
import { AppLayout } from "@/components/shared/app-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function ChatSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
        <Skeleton className="size-5" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function ChatItem({
  chat,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  chat: {
    id: string;
    title: string | null;
    status: string;
    updatedAt: Date;
  };
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const assistantApi = useAssistantApi();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    assistantApi.threads().switchToThread(chat.id);
    router.push(`/chat/${chat.id}`);
  };

  const isArchived = chat.status === "archived";

  return (
    <div className="group flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
      <Link
        href={`/chat/${chat.id}`}
        onClick={handleClick}
        className="flex flex-1 items-center gap-4"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
          <MessageSquare className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-sm">
              {chat.title || "New Chat"}
            </span>
            {isArchived && (
              <Archive className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(chat.updatedAt), {
              addSuffix: true,
            })}
          </div>
        </div>
      </Link>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:bg-sidebar-accent data-[state=open]:opacity-100"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right">
            {isArchived ? (
              <DropdownMenuItem onClick={onUnarchive}>
                <ArchiveRestore className="size-4" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="size-4" />
                Archive
              </DropdownMenuItem>
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
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChatsContent() {
  const router = useRouter();
  const assistantApi = useAssistantApi();
  const utils = api.useUtils();
  const [search, setSearch] = useState("");

  const { data: chats, isLoading } = api.chat.list.useQuery();

  const filteredChats = useMemo(() => {
    if (!chats || !search.trim()) return chats;
    const query = search.toLowerCase().trim();
    return chats.filter((chat) =>
      (chat.title || "New Chat").toLowerCase().includes(query),
    );
  }, [chats, search]);

  const updateMutation = api.chat.update.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
    },
  });

  const deleteMutation = api.chat.delete.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      toast.success("Chat deleted");
    },
    onError: () => {
      toast.error("Failed to delete chat");
    },
  });

  const handleArchive = (id: string) => {
    updateMutation.mutate({ id, status: "archived" });
  };

  const handleUnarchive = (id: string) => {
    updateMutation.mutate({ id, status: "regular" });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleNewChat = () => {
    assistantApi.threads().switchToNewThread();
    router.push("/");
  };

  const regularChats =
    filteredChats?.filter((c) => c.status === "regular") ?? [];
  const archivedChats =
    filteredChats?.filter((c) => c.status === "archived") ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-medium text-xl tracking-tight">Chats</h1>
          <Button variant="default" size="sm" onClick={handleNewChat}>
            <Plus className="size-4" />
            New Chat
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <ChatSkeleton />
            <ChatSkeleton />
            <ChatSkeleton />
          </div>
        ) : chats?.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
              <MessageSquare className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No chats yet</p>
              <p className="text-muted-foreground text-sm">
                Start a new conversation to get started
              </p>
            </div>
            <Button onClick={handleNewChat}>
              <Plus className="size-4" />
              New Chat
            </Button>
          </div>
        ) : filteredChats?.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No results found</p>
              <p className="text-muted-foreground text-sm">
                Try a different search term
              </p>
            </div>
          </div>
        ) : (
          <>
            {regularChats.length > 0 && (
              <div className="flex flex-col gap-2">
                {regularChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    onArchive={() => handleArchive(chat.id)}
                    onUnarchive={() => handleUnarchive(chat.id)}
                    onDelete={() => handleDelete(chat.id)}
                  />
                ))}
              </div>
            )}

            {archivedChats.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Archive className="size-4" />
                  Archived
                </h2>
                <div className="flex flex-col gap-2">
                  {archivedChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      onArchive={() => handleArchive(chat.id)}
                      onUnarchive={() => handleUnarchive(chat.id)}
                      onDelete={() => handleDelete(chat.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <ChatsContent />
      </div>
    </AppLayout>
  );
}
