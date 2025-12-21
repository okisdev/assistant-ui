"use client";

import { useState } from "react";
import { Share2, Check, Copy, Link, Loader2, Trash } from "lucide-react";
import { useAssistantState } from "@assistant-ui/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/trpc/client";

export function ChatHeaderShare() {
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);
  const chatId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
        toast.success("Share link created");
      }
    },
    onError: () => {
      toast.error("Failed to create share link");
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
      toast.success("Share link deleted");
    },
    onError: () => {
      toast.error("Failed to delete share link");
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
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLoading =
    isLoadingShare ||
    createShareMutation.isPending ||
    deleteShareMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Share2 className="size-4" />
          <span className="sr-only">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            {existingShare
              ? "Anyone with this link can view this conversation."
              : "Create a public link to share this conversation."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : existingShare ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl ?? ""}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeleteShare}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="size-4" />
                Delete link
              </Button>
              <Button type="button" onClick={handleCopyLink}>
                <Copy className="size-4" />
                Copy link
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter>
            <Button type="button" onClick={handleCreateShare}>
              <Link className="size-4" />
              Create share link
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
