"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Archive,
  MoreVertical,
  Trash2,
  ArchiveRestore,
  Plus,
  Search,
  CheckSquare,
  X,
  FolderInput,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { useAssistantApi } from "@assistant-ui/react";

import { api } from "@/utils/trpc/client";
import { AppLayout } from "@/components/shared/app-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { cn } from "@/lib/utils";

function ChatSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
        <Skeleton className="size-5" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

type ProjectInfo = {
  id: string;
  name: string;
  color: string | null;
};

function ChatItem({
  chat,
  project,
  onArchive,
  onUnarchive,
  onDelete,
  isSelectionMode,
  isSelected,
  onToggleSelect,
}: {
  chat: {
    id: string;
    title: string | null;
    status: string;
    projectId: string | null;
    updatedAt: Date;
  };
  project?: ProjectInfo | null;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const router = useRouter();
  const assistantApi = useAssistantApi();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSelectionMode) {
      onToggleSelect?.();
    } else {
      assistantApi.threads().switchToThread(chat.id);
      router.push(`/chat/${chat.id}`);
    }
  };

  const isArchived = chat.status === "archived";

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg px-4 py-3 transition-colors",
        isSelected
          ? "bg-primary/10 hover:bg-primary/15"
          : "bg-muted/50 hover:bg-muted",
      )}
    >
      {isSelectionMode && (
        <div className="mr-2 flex items-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.()}
          />
        </div>
      )}
      <Link
        href={isSelectionMode ? "#" : `/chat/${chat.id}`}
        onClick={handleClick}
        className="flex flex-1 items-center gap-4"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
          <MessageSquare className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-sm">
              {chat.title || "New Chat"}
            </span>
            {isArchived && (
              <Archive className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>
              {formatDistanceToNow(new Date(chat.updatedAt), {
                addSuffix: true,
              })}
            </span>
            {project && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: project.color || "#6b7280" }}
                  />
                  <span className="truncate">{project.name}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {!isSelectionMode && (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:bg-sidebar-accent data-[state=open]:opacity-100"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right">
              {isArchived ? (
                <DropdownMenuItem onClick={onUnarchive}>
                  <ArchiveRestore className="size-4" />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="size-4" />
                  Archive
                </DropdownMenuItem>
              )}
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
              <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                chat and all its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function ChatsContent() {
  const router = useRouter();
  const assistantApi = useAssistantApi();
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [projectSearch, setProjectSearch] = useState("");

  const {
    data: chatsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.chat.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const { data: projects } = api.project.list.useQuery();

  const chats = useMemo(() => {
    const allItems = chatsData?.pages.flatMap((page) => page.items) ?? [];
    const seen = new Set<string>();
    return allItems.filter((chat) => {
      if (seen.has(chat.id)) return false;
      seen.add(chat.id);
      return true;
    });
  }, [chatsData]);

  const filteredChats = useMemo(() => {
    if (!chats.length || !search.trim()) return chats;
    const query = search.toLowerCase().trim();
    return chats.filter((chat) =>
      (chat.title || "New Chat").toLowerCase().includes(query),
    );
  }, [chats, search]);

  const updateMutation = api.chat.update.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
    },
  });

  const deleteMutation = api.chat.delete.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      toast.success("Chat deleted");
    },
    onError: () => {
      toast.error("Failed to delete chat");
    },
  });

  const bulkUpdateMutation = api.chat.bulkUpdate.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      toast.success("Chats updated");
    },
    onError: () => {
      toast.error("Failed to update chats");
    },
  });

  const bulkDeleteMutation = api.chat.bulkDelete.useMutation({
    onSuccess: () => {
      utils.chat.list.invalidate();
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      toast.success("Chats deleted");
    },
    onError: () => {
      toast.error("Failed to delete chats");
    },
  });

  const handleArchive = (id: string) => {
    updateMutation.mutate({ id, status: "archived" });
  };

  const handleUnarchive = (id: string) => {
    updateMutation.mutate({ id, status: "regular" });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleNewChat = () => {
    assistantApi.threads().switchToNewThread();
    router.push("/");
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!filteredChats) return;
    const allIds = filteredChats.map((c) => c.id);
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkMove = () => {
    bulkUpdateMutation.mutate({
      ids: [...selectedIds],
      projectId: selectedProjectId,
    });
    setIsMoveDialogOpen(false);
    setSelectedProjectId(null);
  };

  const handleMoveDialogOpenChange = (open: boolean) => {
    setIsMoveDialogOpen(open);
    if (open) {
      // If all selected chats belong to the same project, pre-select it
      const selectedChats = filteredChats?.filter((c) => selectedIds.has(c.id));
      const projectIds = new Set(selectedChats?.map((c) => c.projectId));
      if (projectIds.size === 1) {
        const commonProjectId = selectedChats?.[0]?.projectId ?? null;
        setSelectedProjectId(commonProjectId);
      } else {
        setSelectedProjectId(null);
      }
    } else {
      setSelectedProjectId(null);
      setProjectSearch("");
    }
  };

  const filteredProjects = useMemo(() => {
    if (!projects || !projectSearch.trim()) return projects;
    const query = projectSearch.toLowerCase().trim();
    return projects.filter((project) =>
      project.name.toLowerCase().includes(query),
    );
  }, [projects, projectSearch]);

  const projectMap = useMemo(() => {
    if (!projects) return new Map<string, ProjectInfo>();
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  const getProject = (projectId: string | null) => {
    if (!projectId) return null;
    return projectMap.get(projectId) ?? null;
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({ ids: [...selectedIds] });
  };

  const regularChats =
    filteredChats?.filter((c) => c.status === "regular") ?? [];
  const archivedChats =
    filteredChats?.filter((c) => c.status === "archived") ?? [];
  const allSelectableIds = filteredChats?.map((c) => c.id) ?? [];
  const isAllSelected =
    allSelectableIds.length > 0 && selectedIds.size === allSelectableIds.length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-medium text-xl tracking-tight">Chats</h1>
          <Button variant="default" size="sm" onClick={handleNewChat}>
            <Plus className="size-4" />
            New Chat
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {chats.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
            {isSelectionMode ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-muted-foreground"
                  >
                    {isAllSelected ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog
                    open={isMoveDialogOpen}
                    onOpenChange={handleMoveDialogOpenChange}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedIds.size === 0}
                      >
                        <FolderInput className="size-4" />
                        Move to...
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Move to Project</DialogTitle>
                        <DialogDescription>
                          Move {selectedIds.size} selected chat
                          {selectedIds.size > 1 ? "s" : ""} to a project for
                          better organization.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search projects..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="-mx-2 flex max-h-64 flex-col gap-1 overflow-y-auto px-2">
                        {!projectSearch.trim() && (
                          <button
                            type="button"
                            onClick={() => setSelectedProjectId(null)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                              selectedProjectId === null
                                ? "bg-primary/10"
                                : "hover:bg-muted",
                            )}
                          >
                            <div className="flex size-8 items-center justify-center rounded-full bg-muted/50">
                              <Minus className="size-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm">No Project</span>
                          </button>
                        )}
                        {filteredProjects?.length === 0 ? (
                          <div className="py-8 text-center text-muted-foreground text-sm">
                            No projects found
                          </div>
                        ) : (
                          filteredProjects?.map((project) => (
                            <button
                              type="button"
                              key={project.id}
                              onClick={() => setSelectedProjectId(project.id)}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                                selectedProjectId === project.id
                                  ? "bg-primary/10"
                                  : "hover:bg-muted",
                              )}
                            >
                              <div
                                className="flex size-8 items-center justify-center rounded-full"
                                style={{
                                  backgroundColor: `${project.color || "#6b7280"}20`,
                                }}
                              >
                                <div
                                  className="size-3 rounded-full"
                                  style={{
                                    backgroundColor: project.color || "#6b7280",
                                  }}
                                />
                              </div>
                              <span className="text-sm">{project.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => handleMoveDialogOpenChange(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleBulkMove}>Confirm</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedIds.size === 0}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {selectedIds.size} chat
                          {selectedIds.size > 1 ? "s" : ""}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the selected chats and all their messages.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelSelection}
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setIsSelectionMode(true)}
              >
                <CheckSquare className="size-4" />
                Select
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <ChatSkeleton />
            <ChatSkeleton />
            <ChatSkeleton />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
              <MessageSquare className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No chats yet</p>
              <p className="text-muted-foreground text-sm">
                Start a new conversation to get started
              </p>
            </div>
            <Button onClick={handleNewChat}>
              <Plus className="size-4" />
              New Chat
            </Button>
          </div>
        ) : filteredChats?.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No results found</p>
              <p className="text-muted-foreground text-sm">
                Try a different search term
              </p>
            </div>
          </div>
        ) : (
          <>
            {regularChats.length > 0 && (
              <div className="flex flex-col gap-2">
                {regularChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    project={getProject(chat.projectId)}
                    onArchive={() => handleArchive(chat.id)}
                    onUnarchive={() => handleUnarchive(chat.id)}
                    onDelete={() => handleDelete(chat.id)}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(chat.id)}
                    onToggleSelect={() => handleToggleSelect(chat.id)}
                  />
                ))}
              </div>
            )}

            {archivedChats.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Archive className="size-4" />
                  Archived
                </h2>
                <div className="flex flex-col gap-2">
                  {archivedChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      project={getProject(chat.projectId)}
                      onArchive={() => handleArchive(chat.id)}
                      onUnarchive={() => handleUnarchive(chat.id)}
                      onDelete={() => handleDelete(chat.id)}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.has(chat.id)}
                      onToggleSelect={() => handleToggleSelect(chat.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasNextPage && !search.trim() && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <ChatsContent />
      </div>
    </AppLayout>
  );
}
