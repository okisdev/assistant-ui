"use client";

import { useState, useRef, useEffect } from "react";
import {
  Check,
  ChevronDown,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import {
  ThreadListItemPrimitive,
  useAssistantApi,
  useAssistantState,
} from "@assistant-ui/react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

export function ChatHeaderTitle() {
  const api = useAssistantApi();
  const title = useAssistantState(({ threadListItem }) => threadListItem.title);
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);
  const isArchived = useAssistantState(
    ({ threadListItem }) => threadListItem.status === "archived",
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEmpty) return null;

  const displayTitle = title || "New Chat";

  const handleStartEdit = () => {
    setEditValue(displayTitle);
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      api.threadListItem().rename(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <ButtonGroup>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-7 w-40 rounded-md rounded-r-none border border-input bg-transparent px-2 font-medium text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleSave}
          className="size-7 rounded-l-none border-l-0"
        >
          <Check className="size-3.5" />
        </Button>
      </ButtonGroup>
    );
  }

  return (
    <AlertDialog>
      <ButtonGroup>
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={handleStartEdit}
        >
          {displayTitle}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 pl-2!">
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={handleStartEdit}>
                <Pencil />
                Rename
              </DropdownMenuItem>
              {isArchived ? (
                <ThreadListItemPrimitive.Unarchive asChild>
                  <DropdownMenuItem>
                    <ArchiveRestore />
                    Restore
                  </DropdownMenuItem>
                </ThreadListItemPrimitive.Unarchive>
              ) : (
                <ThreadListItemPrimitive.Archive asChild>
                  <DropdownMenuItem>
                    <Archive />
                    Archive
                  </DropdownMenuItem>
                </ThreadListItemPrimitive.Archive>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem variant="destructive">
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the chat
            and all its messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <ThreadListItemPrimitive.Delete asChild>
            <AlertDialogAction>Delete</AlertDialogAction>
          </ThreadListItemPrimitive.Delete>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
