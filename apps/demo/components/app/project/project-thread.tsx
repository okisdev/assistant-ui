"use client";

import { useState, type FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  MessagesSquare,
  ChevronRight,
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";
import {
  AssistantIf,
  ThreadPrimitive,
  useAssistantApi,
} from "@assistant-ui/react";
import { toast } from "sonner";

import {
  AssistantMessage,
  EditComposer,
  ThreadScrollToBottom,
  UserMessage,
} from "@/components/assistant-ui/thread/primitives";
import { Composer } from "@/components/assistant-ui/thread/composer";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAutoGenerateTitle } from "@/hooks/ai/use-auto-generate-title";
import { useSyncFeedback } from "@/hooks/use-sync-feedback";
import { api } from "@/utils/trpc/client";
import { cn } from "@/lib/utils";
import { ProjectEditDialog } from "./id/edit-dialog";

type ProjectThreadProps = {
  projectId: string;
  projectName: string;
};

export const ProjectThread: FC<ProjectThreadProps> = ({
  projectId,
  projectName,
}) => {
  useAutoGenerateTitle();
  useSyncFeedback();

  return (
    <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
      <AssistantIf condition={({ thread }) => !thread.isEmpty}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-background via-60% via-background/80 to-transparent dark:via-50%" />
      </AssistantIf>

      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth"
      >
        <AssistantIf condition={({ thread }) => thread.isEmpty}>
          <ProjectWelcome projectId={projectId} projectName={projectName} />
        </AssistantIf>

        <AssistantIf condition={({ thread }) => !thread.isEmpty}>
          <div className="h-16 shrink-0" />
        </AssistantIf>

        <div className="mx-auto w-full max-w-2xl px-4 pb-12">
          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              EditComposer,
              AssistantMessage,
            }}
          />
        </div>

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mx-auto mt-auto w-full max-w-2xl bg-background px-4 pt-4 pb-4">
          <AssistantIf condition={({ thread }) => !thread.isEmpty}>
            <div className="pointer-events-none absolute inset-x-0 -top-12 h-12 bg-linear-to-t from-background to-transparent" />
          </AssistantIf>
          <ThreadScrollToBottom />
          <AssistantIf condition={({ thread }) => !thread.isEmpty}>
            <div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
              <Composer />
            </div>
          </AssistantIf>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

// Project-specific welcome component - aligned at top, not centered
function ProjectWelcome({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  return (
    <div className="flex flex-col">
      <ProjectContentHeader projectId={projectId} projectName={projectName} />
      <div className="fade-in mx-auto w-full max-w-2xl animate-in px-4 duration-300">
        <Composer placeholder="What would you like to work on?" />
      </div>
      <ProjectConversationsList projectId={projectId} />
    </div>
  );
}

function ProjectContentHeader({
  projectId,
  projectName: initialProjectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState(initialProjectName);

  const { data: project } = api.project.get.useQuery({ id: projectId });
  const utils = api.useUtils();

  const updateMutation = api.project.update.useMutation({
    onSuccess: () => {
      utils.project.get.invalidate({ id: projectId });
      toast.success("Instructions updated");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update instructions");
    },
  });

  const deleteMutation = api.project.delete.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      toast.success("Project deleted");
      router.push("/projects");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  const toggleStarMutation = api.project.toggleStar.useMutation({
    onSuccess: (data) => {
      utils.project.get.invalidate({ id: projectId });
      utils.project.list.invalidate();
      toast.success(data.isStarred ? "Project starred" : "Project unstarred");
    },
    onError: () => {
      toast.error("Failed to update star");
    },
  });

  const handleToggleStar = () => {
    toggleStarMutation.mutate({ id: projectId });
  };

  const handleEditInstructions = () => {
    setDraft(project?.instructions || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: projectId,
      instructions: draft.trim() || null,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraft("");
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: projectId });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-8">
      {/* Back + Menu Row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-1 size-4" />
            <p className="font-medium">Projects</p>
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleToggleStar}
            disabled={toggleStarMutation.isPending}
          >
            <Star
              className={cn(
                "size-4",
                project?.isStarred && "fill-amber-400 text-amber-400",
              )}
            />
          </Button>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="size-4" />
                  Edit
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
                <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  project, all its chats, and all its documents.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Title + Description */}
      <div className="space-y-3">
        <h1 className="flex items-center gap-2.5 font-medium text-2xl tracking-tight">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: project?.color || "#3b82f6" }}
          />
          {projectName}
        </h1>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a description for this project..."
              className="min-h-20 resize-none text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        ) : project?.instructions ? (
          <button
            type="button"
            onClick={handleEditInstructions}
            className="text-left text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <p className="line-clamp-2 whitespace-pre-wrap">
              {project.instructions}
            </p>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEditInstructions}
            className="text-muted-foreground/60 text-sm transition-colors hover:text-muted-foreground"
          >
            Add project instructions...
          </button>
        )}
      </div>
      <ProjectEditDialog
        projectId={projectId}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onNameChange={setProjectName}
      />
    </div>
  );
}

function ProjectConversationsList({ projectId }: { projectId: string }) {
  const { data: chats, isLoading } = api.chat.list.useQuery({
    projectId,
  });

  // Filter out chats without title (new/empty chats)
  const conversationsWithTitle = chats?.filter((chat) => chat.title);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-12">
        <ConversationsListSkeleton />
      </div>
    );
  }

  if (!conversationsWithTitle || conversationsWithTitle.length === 0) {
    return null;
  }

  return (
    <div className="fade-in slide-in-from-bottom-4 mx-auto w-full max-w-2xl animate-in fill-mode-both px-4 pt-12 pb-8 delay-300 duration-500">
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
          <MessagesSquare className="size-4" />
          Recent conversations
        </h2>
        <div className="space-y-1">
          {conversationsWithTitle.slice(0, 5).map((chat) => (
            <ConversationItem key={chat.id} chat={chat} />
          ))}
        </div>
        {conversationsWithTitle.length > 5 && (
          <Link
            href="/chats"
            className="group flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            View all ({conversationsWithTitle.length})
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

type ChatData = {
  id: string;
  title: string | null;
  updatedAt: Date;
};

function ConversationItem({ chat }: { chat: ChatData }) {
  const router = useRouter();
  const assistantApi = useAssistantApi();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    assistantApi.threads().switchToThread(chat.id);
    router.push(`/chat/${chat.id}`);
  };

  return (
    <Link
      href={`/chat/${chat.id}`}
      onClick={handleClick}
      className="group flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
    >
      <span className="truncate">{chat.title || "New Chat"}</span>
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
      </span>
    </Link>
  );
}

function ConversationsListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-1">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
