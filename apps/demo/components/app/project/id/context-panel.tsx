"use client";

import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Brain,
  ScrollText,
  Trash2,
  Upload,
  Loader2,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/utils/trpc/client";
import {
  uploadProjectDocument,
  ACCEPTED_DOCUMENT_TYPES,
} from "@/lib/adapters/project-document-adapter";
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  action,
  isOpen,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  action?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <CollapsibleTrigger
        onClick={onToggle}
        className="flex flex-1 items-center gap-2 py-2 text-left"
      >
        <Icon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
            {count}
          </span>
        )}
        <ChevronDown
          className={cn(
            "ml-auto size-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      {action}
    </div>
  );
}

function InstructionsSection({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

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

  const handleEdit = () => {
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SectionHeader
        icon={ScrollText}
        title="Instructions"
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />
      <CollapsibleContent>
        <div className="space-y-2 pb-4">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add custom instructions for this project..."
                className="min-h-24 resize-none text-sm"
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
                  {updateMutation.isPending && (
                    <Loader2 className="size-3 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : project?.instructions ? (
            <button
              type="button"
              onClick={handleEdit}
              className="w-full cursor-pointer rounded-lg bg-muted/50 p-3 text-left text-sm transition-colors hover:bg-muted"
            >
              <p className="line-clamp-4 whitespace-pre-wrap">
                {project.instructions}
              </p>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted/50 py-6 text-muted-foreground text-sm transition-colors hover:bg-muted"
            >
              <Plus className="size-4" />
              Add instructions
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MemorySection({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: memories, isLoading } = api.memory.list.useQuery({ projectId });
  const utils = api.useUtils();

  // Filter to only show project-specific memories
  const projectMemories = memories?.filter((m) => m.projectId === projectId);

  const deleteMutation = api.memory.delete.useMutation({
    onSuccess: () => {
      utils.memory.list.invalidate({ projectId });
      toast.success("Memory deleted");
      setDeletingId(null);
    },
    onError: () => {
      toast.error("Failed to delete memory");
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate({ id });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SectionHeader
        icon={Brain}
        title="Memory"
        count={projectMemories?.length}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />
      <CollapsibleContent>
        <div className="space-y-2 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : projectMemories && projectMemories.length > 0 ? (
            projectMemories.map((memory) => (
              <div
                key={memory.id}
                className="group flex items-start gap-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="min-w-0 flex-1">
                  {memory.category && (
                    <span className="mb-1 inline-block rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                      {memory.category}
                    </span>
                  )}
                  <p className="text-sm">{memory.content}</p>
                  <span className="mt-1 block text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(memory.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        disabled={deletingId === memory.id}
                      >
                        {deletingId === memory.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <MoreVertical className="size-3" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                      <AlertDialogTitle>Delete memory?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this memory. The AI will no
                        longer have access to this information.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(memory.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 py-6">
              <Brain className="size-6 text-muted-foreground" />
              <p className="text-muted-foreground text-xs">
                No project memories yet
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DocumentsSection({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: documents, isLoading } = api.project.listDocuments.useQuery({
    projectId,
  });
  const utils = api.useUtils();

  const addDocumentMutation = api.project.addDocument.useMutation({
    onSuccess: () => {
      utils.project.listDocuments.invalidate({ projectId });
    },
  });

  const removeDocumentMutation = api.project.removeDocument.useMutation({
    onSuccess: () => {
      utils.project.listDocuments.invalidate({ projectId });
      toast.success("Document deleted");
      setDeletingId(null);
    },
    onError: () => {
      toast.error("Failed to delete document");
      setDeletingId(null);
    },
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];

    try {
      const result = await uploadProjectDocument(projectId, file);

      await addDocumentMutation.mutateAsync({
        projectId,
        name: result.name,
        url: result.url,
        pathname: result.pathname,
        contentType: result.contentType,
        size: result.size,
        extractedText: result.extractedText,
      });

      toast.success("Document uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    removeDocumentMutation.mutate({ id });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SectionHeader
        icon={FileText}
        title="Documents"
        count={documents?.length}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_DOCUMENT_TYPES}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Upload className="size-3" />
              )}
            </Button>
          </>
        }
      />
      <CollapsibleContent>
        <div className="space-y-2 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : documents && documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center gap-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted/50">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{doc.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(doc.size)}
                  </p>
                </div>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        disabled={deletingId === doc.id}
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <MoreVertical className="size-3" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4" />
                          Open
                        </a>
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
                      <AlertDialogTitle>Delete document?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{doc.name}&quot; from
                        the project. The AI will no longer have access to this
                        document.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(doc.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          ) : (
            <button
              type="button"
              onClick={handleUploadClick}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted/50 py-6 text-muted-foreground text-sm transition-colors hover:bg-muted"
            >
              <Upload className="size-4" />
              Upload document
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProjectContextPanel({ projectId }: { projectId: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          <InstructionsSection projectId={projectId} />
          <MemorySection projectId={projectId} />
          <DocumentsSection projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
