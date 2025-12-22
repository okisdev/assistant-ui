"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Brain,
  Trash2,
  MoreVertical,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <div className="group flex items-start gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        {memory.category && (
          <span className="mb-1 inline-block rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
            {memory.category}
          </span>
        )}
        <p className="text-sm">{memory.content}</p>
        <span className="mt-1 block text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(memory.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
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

function MemorySkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function MemoriesDialog() {
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

  const clearMutation = api.memory.clear.useMutation({
    onSuccess: () => {
      utils.memory.list.invalidate();
      toast.success("All memories cleared");
    },
    onError: () => {
      toast.error("Failed to clear memories");
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate({ id });
  };

  const handleClearAll = () => {
    clearMutation.mutate();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
        >
          View memories
          <ChevronRight className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Memories</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {isLoading ? (
            <>
              <MemorySkeleton />
              <MemorySkeleton />
              <MemorySkeleton />
            </>
          ) : memories && memories.length > 0 ? (
            <>
              {memories.map((memory) => (
                <MemoryItem
                  key={memory.id}
                  memory={memory}
                  isDeleting={deletingId === memory.id}
                  onDelete={() => handleDelete(memory.id)}
                />
              ))}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 self-start text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Clear all
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all memories?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your saved memories. The
                      AI will no longer remember any personal information about
                      you.
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
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-12">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
                <Brain className="size-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No memories yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CapabilityRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
  badge,
  action,
}: {
  title: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {badge && (
            <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function MemorySection() {
  const { data: capabilities, isLoading: isCapabilitiesLoading } =
    api.user.getCapabilities.useQuery();
  const utils = api.useUtils();

  const updateCapabilitiesMutation = api.user.updateCapabilities.useMutation({
    onSuccess: () => {
      utils.user.getCapabilities.invalidate();
    },
    onError: () => {
      toast.error("Failed to update setting");
    },
  });

  const handleTogglePersonalization = (enabled: boolean) => {
    updateCapabilitiesMutation.mutate({ personalization: enabled });
  };

  const personalization = capabilities?.personalization ?? true;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-medium text-xl tracking-tight">Memory</h1>

      <div className="flex flex-col gap-2">
        <CapabilityRow
          title="Personalization"
          description="AI remembers your preferences and information from conversations"
          checked={personalization}
          disabled={
            isCapabilitiesLoading || updateCapabilitiesMutation.isPending
          }
          onCheckedChange={handleTogglePersonalization}
          action={<MemoriesDialog />}
        />
        <CapabilityRow
          title="Chat history context"
          description="AI can reference your past conversations for context"
          checked={false}
          disabled
          badge="Coming soon"
        />
      </div>
    </div>
  );
}
