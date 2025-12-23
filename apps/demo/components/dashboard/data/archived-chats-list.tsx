"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Trash2,
  RotateCcw,
  MoreVertical,
  Loader2,
  Archive,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ChatSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="size-10 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

type ArchivedChat = {
  id: string;
  title: string | null;
  updatedAt: Date;
};

function ArchivedChatItem({
  chat,
  isProcessing,
  onRestore,
  onDelete,
}: {
  chat: ArchivedChat;
  isProcessing: boolean;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const title = chat.title || "Untitled";

  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
        <MessageSquare className="size-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/chats/${chat.id}`}
          className="truncate font-medium text-sm hover:underline"
        >
          {title}
        </Link>
        <div className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
        </div>
      </div>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreVertical className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRestore}>
              <RotateCcw className="size-4" />
              Unarchive
            </DropdownMenuItem>
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
              This chat will be moved to trash and automatically deleted after
              30 days. You can restore it from the Trash tab.
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

export function ArchivedChatsList() {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: chats, isLoading } = api.chat.listArchived.useQuery();
  const utils = api.useUtils();

  const updateMutation = api.chat.update.useMutation({
    onSuccess: () => {
      utils.chat.listArchived.invalidate();
      utils.chat.list.invalidate();
      toast.success("Chat unarchived");
      setProcessingId(null);
    },
    onError: () => {
      toast.error("Failed to unarchive chat");
      setProcessingId(null);
    },
  });

  const deleteMutation = api.chat.delete.useMutation({
    onSuccess: () => {
      utils.chat.listArchived.invalidate();
      utils.chat.listDeleted.invalidate();
      toast.success("Chat moved to trash");
      setProcessingId(null);
    },
    onError: () => {
      toast.error("Failed to delete chat");
      setProcessingId(null);
    },
  });

  const handleRestore = (id: string) => {
    setProcessingId(id);
    updateMutation.mutate({ id, status: "regular" });
  };

  const handleDelete = (id: string) => {
    setProcessingId(id);
    deleteMutation.mutate({ id });
  };

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <>
          <ChatSkeleton />
          <ChatSkeleton />
          <ChatSkeleton />
        </>
      ) : chats && chats.length > 0 ? (
        chats.map((chat) => (
          <ArchivedChatItem
            key={chat.id}
            chat={chat}
            isProcessing={processingId === chat.id}
            onRestore={() => handleRestore(chat.id)}
            onDelete={() => handleDelete(chat.id)}
          />
        ))
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
            <Archive className="size-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No archived chats</p>
        </div>
      )}
    </div>
  );
}
