"use client";

import { useState } from "react";
import { formatDistanceToNow, differenceInDays, addDays } from "date-fns";
import {
  MessageSquare,
  Trash2,
  RotateCcw,
  MoreVertical,
  Loader2,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const RETENTION_DAYS = 30;

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

type DeletedChat = {
  id: string;
  title: string | null;
  deletedAt: Date | null;
};

function DeletedChatItem({
  chat,
  isProcessing,
  onRestore,
  onPermanentDelete,
}: {
  chat: DeletedChat;
  isProcessing: boolean;
  onRestore: () => void;
  onPermanentDelete: () => void;
}) {
  const title = chat.title || "Untitled";
  const deletedAt = chat.deletedAt ? new Date(chat.deletedAt) : new Date();
  const expiresAt = addDays(deletedAt, RETENTION_DAYS);
  const daysRemaining = Math.max(0, differenceInDays(expiresAt, new Date()));

  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
        <MessageSquare className="size-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm">{title}</span>
          <Badge
            variant="secondary"
            className={
              daysRemaining <= 7
                ? "bg-destructive/10 text-destructive"
                : "bg-muted"
            }
          >
            {daysRemaining} days left
          </Badge>
        </div>
        <div className="text-muted-foreground text-xs">
          Deleted{" "}
          {formatDistanceToNow(deletedAt, {
            addSuffix: true,
          })}
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
              Restore
            </DropdownMenuItem>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="size-4" />
                Delete permanently
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This chat and all its messages will
              be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onPermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function DeletedChatsList() {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: chats, isLoading } = api.chat.listDeleted.useQuery();
  const utils = api.useUtils();

  const restoreMutation = api.chat.restore.useMutation({
    onSuccess: () => {
      utils.chat.listDeleted.invalidate();
      utils.chat.list.invalidate();
      toast.success("Chat restored");
      setProcessingId(null);
    },
    onError: () => {
      toast.error("Failed to restore chat");
      setProcessingId(null);
    },
  });

  const permanentDeleteMutation = api.chat.permanentDelete.useMutation({
    onSuccess: () => {
      utils.chat.listDeleted.invalidate();
      toast.success("Chat permanently deleted");
      setProcessingId(null);
    },
    onError: () => {
      toast.error("Failed to delete chat");
      setProcessingId(null);
    },
  });

  const handleRestore = (id: string) => {
    setProcessingId(id);
    restoreMutation.mutate({ id });
  };

  const handlePermanentDelete = (id: string) => {
    setProcessingId(id);
    permanentDeleteMutation.mutate({ id });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Deleted chats are automatically removed after {RETENTION_DAYS} days.
      </p>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <ChatSkeleton />
            <ChatSkeleton />
            <ChatSkeleton />
          </>
        ) : chats && chats.length > 0 ? (
          chats.map((chat) => (
            <DeletedChatItem
              key={chat.id}
              chat={chat}
              isProcessing={processingId === chat.id}
              onRestore={() => handleRestore(chat.id)}
              onPermanentDelete={() => handlePermanentDelete(chat.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-12">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
              <Trash className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Trash is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
