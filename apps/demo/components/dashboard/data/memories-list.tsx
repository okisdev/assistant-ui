"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Brain, Trash2, MoreVertical, Loader2 } from "lucide-react";
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

type MemoryRow = {
  id: string;
  content: string;
  category: string | null;
  createdAt: Date;
};

function MemorySkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}

function MemoryItem({
  memory,
  isDeleting,
  onDelete,
}: {
  memory: MemoryRow;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm">{memory.content}</p>
        {memory.category && (
          <span className="mt-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-xs">
            {memory.category}
          </span>
        )}
      </div>

      <span className="shrink-0 text-muted-foreground text-xs">
        {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
      </span>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreVertical className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
            <AlertDialogTitle>Delete memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this memory. The AI will no longer
              have access to this information.
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

export function ClearAllMemoriesAction() {
  const { data: memories } = api.memory.list.useQuery();
  const utils = api.useUtils();

  const clearMutation = api.memory.clear.useMutation({
    onSuccess: () => {
      utils.memory.list.invalidate();
      toast.success("All memories cleared");
    },
    onError: () => {
      toast.error("Failed to clear memories");
    },
  });

  const handleClearAll = () => {
    clearMutation.mutate();
  };

  const hasMemories = memories && memories.length > 0;

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={clearMutation.isPending || !hasMemories}
          >
            {clearMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreVertical className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="size-4" />
              Clear all
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all memories?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all your saved memories. The AI will no
            longer remember any personal information about you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClearAll}>
            Clear all
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MemoriesList() {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: memories, isLoading } = api.memory.list.useQuery();
  const utils = api.useUtils();

  const deleteMutation = api.memory.delete.useMutation({
    onSuccess: () => {
      utils.memory.list.invalidate();
      toast.success("Memory deleted");
      setDeletingId(null);
    },
    onError: () => {
      toast.error("Failed to delete memory");
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate({ id });
  };

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <>
          <MemorySkeleton />
          <MemorySkeleton />
          <MemorySkeleton />
        </>
      ) : memories && memories.length > 0 ? (
        memories.map((memory) => (
          <MemoryItem
            key={memory.id}
            memory={memory}
            isDeleting={deletingId === memory.id}
            onDelete={() => handleDelete(memory.id)}
          />
        ))
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 py-12">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
            <Brain className="size-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No memories yet</p>
        </div>
      )}
    </div>
  );
}
