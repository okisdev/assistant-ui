"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Loader2,
  Share2,
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

function ShareSkeleton() {
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

function ResourceIcon({ type }: { type: string }) {
  switch (type) {
    case "chat":
      return <MessageSquare className="size-5 text-muted-foreground" />;
    default:
      return <Share2 className="size-5 text-muted-foreground" />;
  }
}

type Share = {
  id: string;
  resourceType: string;
  resourceId: string;
  createdAt: Date;
  title: string | null;
};

function ShareItem({
  share,
  isDeleting,
  onDelete,
}: {
  share: Share;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/share/${share.id}`;
  const title = share.title || "Untitled";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
        <ResourceIcon type={share.resourceType} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <span className="capitalize">{share.resourceType}</span>
          <span>·</span>
          <span>
            {formatDistanceToNow(new Date(share.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
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
            <DropdownMenuItem onClick={handleCopy}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/share/${share.id}`} target="_blank">
                <ExternalLink className="size-4" />
                Open link
              </Link>
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
            <AlertDialogTitle>Delete share link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the share link. Anyone with the link
              will no longer be able to view this content.
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

export function SharesList() {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: shares, isLoading } = api.share.list.useQuery();
  const utils = api.useUtils();

  const deleteMutation = api.share.delete.useMutation({
    onSuccess: () => {
      utils.share.list.invalidate();
      toast.success("Share link deleted");
      setDeletingId(null);
    },
    onError: () => {
      toast.error("Failed to delete share link");
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate({ id });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-medium text-xl tracking-tight">Shared Links</h1>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <ShareSkeleton />
            <ShareSkeleton />
            <ShareSkeleton />
          </>
        ) : shares && shares.length > 0 ? (
          shares.map((share) => (
            <ShareItem
              key={share.id}
              share={share}
              isDeleting={deletingId === share.id}
              onDelete={() => handleDelete(share.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-12">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
              <Share2 className="size-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No shared links</p>
          </div>
        )}
      </div>
    </div>
  );
}
