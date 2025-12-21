"use client";

import { Share2 } from "lucide-react";
import { useAssistantState } from "@assistant-ui/react";

import { Button } from "@/components/ui/button";

export function ChatHeaderTitle() {
  const title = useAssistantState(({ threadListItem }) => threadListItem.title);
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);

  if (isEmpty) return null;

  return (
    <span className="truncate font-medium text-sm">{title || "New Chat"}</span>
  );
}

export function ChatHeaderShare() {
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);

  if (isEmpty) return null;

  return (
    <Button variant="ghost" size="icon-sm">
      <Share2 className="size-4" />
      <span className="sr-only">Share</span>
    </Button>
  );
}
