"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  FolderOpen,
  MoreVertical,
  Trash2,
  Pencil,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/shared/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { api } from "@/utils/trpc/client";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
];

function getRandomColor() {
  return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
    .value;
}

type ProjectData = {
  id: string;
  name: string;
  color: string | null;
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function ProjectItem({ project }: { project: ProjectData }) {
  const utils = api.useUtils();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const updateMutation = api.project.update.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      toast.success("Project renamed");
      setRenameOpen(false);
    },
    onError: () => {
      toast.error("Failed to rename project");
    },
  });

  const deleteMutation = api.project.delete.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      toast.success("Project deleted");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  const toggleStarMutation = api.project.toggleStar.useMutation({
    onSuccess: (data) => {
      utils.project.list.invalidate();
      toast.success(data.isStarred ? "Project starred" : "Project unstarred");
    },
    onError: () => {
      toast.error("Failed to update star");
    },
  });

  const handleRenameOpen = () => {
    setRenameValue(project.name);
    setRenameOpen(true);
  };

  const handleRename = () => {
    const name = renameValue.trim();
    if (name && name !== project.name) {
      updateMutation.mutate({ id: project.id, name });
    } else {
      setRenameOpen(false);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: project.id });
  };

  const handleToggleStar = () => {
    toggleStarMutation.mutate({ id: project.id });
  };

  return (
    <div className="group flex items-center gap-1 rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
      <Link
        href={`/project/${project.id}`}
        className="flex flex-1 items-center gap-4"
      >
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
          <FolderOpen className="size-5 text-muted-foreground" />
          <div
            className="absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-background"
            style={{ backgroundColor: project.color || "#3b82f6" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-sm">{project.name}</span>
            {project.isStarred && (
              <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            updated{" "}
            {formatDistanceToNow(new Date(project.updatedAt), {
              addSuffix: true,
            })}
          </div>
        </div>
      </Link>

      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          "text-muted-foreground transition-opacity",
          project.isStarred
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}
        onClick={handleToggleStar}
        disabled={toggleStarMutation.isPending}
      >
        <Star
          className={cn(
            "size-4",
            project.isStarred && "fill-amber-400 text-amber-400",
          )}
        />
      </Button>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
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
              <DropdownMenuItem onSelect={handleToggleStar}>
                <Star
                  className={cn(
                    "size-4",
                    project.isStarred && "fill-amber-400 text-amber-400",
                  )}
                />
                {project.isStarred ? "Unstar" : "Star"}
              </DropdownMenuItem>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={handleRenameOpen}>
                  <Pencil className="size-4" />
                  Rename
                </DropdownMenuItem>
              </DialogTrigger>
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
                project and all its chats and documents.
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRename();
              }
            }}
            placeholder="Project name"
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRename} disabled={updateMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectSkeleton() {
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

function CreateProjectDialog({
  variant = "default",
}: {
  variant?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const utils = api.useUtils();

  const createMutation = api.project.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      toast.success("Project created");
      setOpen(false);
      setName("");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate({ name: trimmed, color: getRandomColor() });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size={variant === "sm" ? "sm" : "default"}>
          <Plus className="size-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              handleCreate();
            }
          }}
          placeholder="Project name"
          autoFocus
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createMutation.isPending}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectsContent() {
  const [search, setSearch] = useState("");
  const { data: projects, isLoading } = api.project.list.useQuery();

  const filteredProjects = useMemo(() => {
    if (!projects || !search.trim()) return projects;
    const query = search.toLowerCase().trim();
    return projects.filter((project) =>
      project.name.toLowerCase().includes(query),
    );
  }, [projects, search]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-medium text-xl tracking-tight">Projects</h1>
          <CreateProjectDialog variant="sm" />
        </div>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <ProjectSkeleton />
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : projects?.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
              <FolderOpen className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No projects yet</p>
              <p className="text-muted-foreground text-sm">
                Create a project to organize your conversations
              </p>
            </div>
            <CreateProjectDialog />
          </div>
        ) : filteredProjects?.length === 0 ? (
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
          <div className="flex flex-col gap-2">
            {filteredProjects?.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <ProjectsContent />
      </div>
    </AppLayout>
  );
}
