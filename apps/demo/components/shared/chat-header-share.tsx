"use client";

import { useState } from "react";
import { Share2, Check, Copy, Link2, Unlink, Download } from "lucide-react";
import { useAssistantState } from "@assistant-ui/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function getMessageText(message: {
  content: readonly { type: string; text?: string }[];
}): string {
  return message.content
    .filter(
      (part): part is { type: "text"; text: string } =>
        part.type === "text" && typeof part.text === "string",
    )
    .map((part) => part.text)
    .join("\n\n");
}

export function ChatHeaderShare() {
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);
  const messages = useAssistantState(({ thread }) => thread.messages);
  const title = useAssistantState(({ threadListItem }) => threadListItem.title);
  const chatId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const utils = api.useUtils();

  const { data: existingShare } = api.share.getByResource.useQuery(
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

  const handleExport = () => {
    const lines: string[] = [];

    if (title) {
      lines.push(`# ${title}`);
      lines.push("");
    }

    for (const message of messages) {
      const roleLabel = message.role === "user" ? "**User**" : "**Assistant**";
      const text = getMessageText(message);

      if (text) {
        lines.push(roleLabel);
        lines.push("");
        lines.push(text);
        lines.push("");
        lines.push("---");
        lines.push("");
      }
    }

    if (lines.length > 0 && lines.at(-2) === "---") {
      lines.splice(-2, 2);
    }

    const markdown = lines.join("\n");
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "conversation"}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Exported");
    setOpen(false);
  };

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

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Share2 className="size-4" />
            <span className="sr-only">Share & Export</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-4">
          <Tabs defaultValue="share" className="gap-4">
            <TabsList className="w-full">
              <TabsTrigger value="share" className="flex-1 gap-1.5">
                <Link2 className="size-3.5" />
                Share
              </TabsTrigger>
              <TabsTrigger value="download" className="flex-1 gap-1.5">
                <Download className="size-3.5" />
                Download
              </TabsTrigger>
            </TabsList>

            <TabsContent value="share">
              {existingShare ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 px-3 py-2.5">
                    <Link2 className="size-4 shrink-0 text-emerald-500" />
                    <p className="min-w-0 truncate text-sm">{shareUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 flex-1"
                      onClick={handleCopyLink}
                    >
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
                      className="h-9 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Unlink className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-sm">
                    Create a public link to share this conversation with anyone.
                  </p>
                  <Button
                    size="sm"
                    className="h-9"
                    onClick={handleCreateShare}
                    disabled={createShareMutation.isPending}
                  >
                    <Link2 className="size-4" />
                    Create link
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="download">
              <div className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm">
                  Export this conversation as a Markdown file.
                </p>
                <Button size="sm" className="h-9" onClick={handleExport}>
                  <Download className="size-4" />
                  Download .md
                </Button>
              </div>
            </TabsContent>
          </Tabs>
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
