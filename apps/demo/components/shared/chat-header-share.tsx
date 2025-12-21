"use client";

import { useState } from "react";
import { Share2, Check, Copy, Link2, Loader2, Unlink } from "lucide-react";
import { useAssistantState } from "@assistant-ui/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/utils/trpc/client";

export function ChatHeaderShare() {
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);
  const chatId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const utils = api.useUtils();

  const { data: existingShare, isLoading: isLoadingShare } =
    api.share.getByResource.useQuery(
      { resourceType: "chat", resourceId: chatId! },
      { enabled: !!chatId && open },
    );

  const createShareMutation = api.share.create.useMutation({
    onSuccess: (data) => {
      if (chatId) {
        utils.share.getByResource.invalidate({
          resourceType: "chat",
          resourceId: chatId,
        });
      }
      if (data.isNew) {
        toast.success("Link created");
      }
    },
    onError: () => {
      toast.error("Failed to create link");
    },
  });

  const deleteShareMutation = api.share.delete.useMutation({
    onSuccess: () => {
      if (chatId) {
        utils.share.getByResource.invalidate({
          resourceType: "chat",
          resourceId: chatId,
        });
      }
      toast.success("Link deleted");
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete link");
    },
  });

  if (isEmpty || !chatId) return null;

  const shareUrl = existingShare
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${existingShare.id}`
    : null;

  const handleCreateShare = () => {
    createShareMutation.mutate({
      resourceType: "chat",
      resourceId: chatId,
    });
  };

  const handleDeleteShare = () => {
    if (existingShare) {
      deleteShareMutation.mutate({ id: existingShare.id });
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLoading =
    isLoadingShare ||
    createShareMutation.isPending ||
    deleteShareMutation.isPending;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Share2 className="size-4" />
            <span className="sr-only">Share</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : existingShare ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <Link2 className="size-4 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">Public link active</p>
                  <p className="truncate text-muted-foreground text-xs">
                    {shareUrl}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Unlink className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Link2 className="size-4 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Create a public link to share this conversation
                </p>
              </div>
              <Button size="sm" onClick={handleCreateShare}>
                <Link2 className="size-4" />
                Create link
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete share link?</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone with the link will no longer be able to view this
              conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShare}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
