"use client";

import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Trash2,
  Upload,
  Loader2,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/utils/trpc/client";
import {
  uploadProjectDocument,
  ACCEPTED_DOCUMENT_TYPES,
} from "@/lib/adapters/project-document-adapter";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type DocumentData = {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  createdAt: Date;
};

function DocumentItem({
  document,
  onDelete,
  isDeleting,
}: {
  document: DocumentData;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <FileText className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{document.name}</p>
        <p className="text-muted-foreground text-xs">
          {formatFileSize(document.size)} •{" "}
          {formatDistanceToNow(new Date(document.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreVertical className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={document.url} target="_blank" rel="noopener noreferrer">
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
              This will permanently delete &quot;{document.name}&quot; from the
              project&apos;s knowledge base. The AI will no longer have access
              to this document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <Skeleton className="size-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function ProjectDocuments({ projectId }: { projectId: string }) {
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
      // Reset file input
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-lg">Knowledge Base</h2>
          <p className="text-muted-foreground text-sm">
            Upload documents to provide context for AI conversations in this
            project.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_DOCUMENT_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <>
            <DocumentSkeleton />
            <DocumentSkeleton />
          </>
        ) : documents && documents.length > 0 ? (
          documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              onDelete={() => handleDelete(doc.id)}
              isDeleting={deletingId === doc.id}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-12">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm">No documents yet</p>
              <p className="text-muted-foreground text-xs">
                Upload documents to build your project&apos;s knowledge base
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
