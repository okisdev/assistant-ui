"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  MoreVertical,
  Trash2,
  Pencil,
  ChevronDown,
  Star,
} from "lucide-react";
import type { FC } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/trpc/client";
import { toast } from "sonner";
import { useNavigation } from "@/contexts/navigation-provider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_PROJECTS = 3;

const ProjectListSkeleton: FC = () => {
  return (
    <SidebarMenu>
      {Array.from({ length: 3 }, (_, i) => (
        <SidebarMenuItem key={i}>
          <div className="flex h-8 items-center px-2">
            <Skeleton className="h-4 w-full" />
          </div>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};

const ProjectListFallback: FC = () => (
  <Collapsible defaultOpen className="group/collapsible">
    <SidebarGroup className="flex-1 overflow-y-auto group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel asChild>
        <CollapsibleTrigger className="flex w-full items-center">
          Projects
          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
        </CollapsibleTrigger>
      </SidebarGroupLabel>
      <CollapsibleContent>
        <SidebarGroupContent>
          <ProjectListSkeleton />
        </SidebarGroupContent>
      </CollapsibleContent>
    </SidebarGroup>
  </Collapsible>
);

type ProjectData = {
  id: string;
  name: string;
  color: string | null;
  isStarred: boolean;
};

const ProjectListEmpty: FC = () => {
  return (
    <div className="px-2 py-4 text-center text-muted-foreground text-sm">
      No projects yet
    </div>
  );
};

const SidebarProjectListContent: FC = () => {
  const { data: projects, isLoading } = api.project.list.useQuery();
  const { selectedProjectId } = useNavigation();

  const visibleProjects = projects?.slice(0, MAX_VISIBLE_PROJECTS) ?? [];
  const hasMore = (projects?.length ?? 0) > MAX_VISIBLE_PROJECTS;

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup className="flex-1 overflow-y-auto group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center">
            Projects
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            {isLoading && <ProjectListSkeleton />}
            {!isLoading && (!projects || projects.length === 0) && (
              <ProjectListEmpty />
            )}
            {!isLoading && projects && projects.length > 0 && (
              <SidebarMenu>
                {visibleProjects.map((project) => (
                  <SidebarProjectListItem
                    key={project.id}
                    project={project}
                    isActive={project.id === selectedProjectId}
                  />
                ))}
                {hasMore && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link
                        href="/projects"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <span>View all ({projects.length})</span>
                        <ChevronRight className="ml-auto size-4" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

export const SidebarProjectList = dynamic(
  () => Promise.resolve(SidebarProjectListContent),
  { ssr: false, loading: () => <ProjectListFallback /> },
);

const SidebarProjectListItem: FC<{
  project: ProjectData;
  isActive: boolean;
}> = ({ project, isActive }) => {
  const router = useRouter();
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
      router.push("/");
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
    <SidebarMenuItem>
      <div
        className={cn(
          "group/item flex h-8 w-full items-center rounded-md text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        )}
      >
        <Link
          href={`/project/${project.id}`}
          className="flex h-full flex-1 items-center gap-2 truncate px-2"
        >
          <div
            className="size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: project.color || "#3b82f6" }}
          />
          <span className="truncate">{project.name}</span>
          {project.isStarred && (
            <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </Link>
        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mr-1 size-6 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-hover/item:opacity-100 data-[state=open]:bg-sidebar-accent data-[state=open]:opacity-100"
                  aria-label="Project options"
                >
                  <MoreVertical className="size-4" />
                </button>
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
              <Button
                onClick={handleRename}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarMenuItem>
  );
};
