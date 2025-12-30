"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Image as ImageIcon,
  FileText,
  Sparkles,
  Search,
  Trash2,
  ExternalLink,
  MoreVertical,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { AppLayout } from "@/components/shared/app-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const VALID_TABS = ["attachments", "images", "artifacts"] as const;
type TabValue = (typeof VALID_TABS)[number];

function ItemSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
      <Skeleton className="size-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function getFileName(pathname: string): string {
  const parts = pathname.split("/");
  return parts[parts.length - 1] || pathname;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentItem({
  item,
  onDelete,
}: {
  item: {
    id: string;
    url: string;
    pathname: string;
    contentType: string;
    size: number;
    chatId: string | null;
    chatTitle: string | null;
    createdAt: Date;
  };
  onDelete: () => void;
}) {
  const fileName = getFileName(item.pathname);
  const isImage = item.contentType.startsWith("image/");

  return (
    <div className="group flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50">
        {isImage ? (
          <img
            src={item.url}
            alt={fileName}
            className="size-full object-cover"
          />
        ) : (
          <FileText className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-sm">{fileName}</div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{formatFileSize(item.size)}</span>
          <span>·</span>
          <span>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
          {item.chatTitle && (
            <>
              <span>·</span>
              <Link
                href={`/chat/${item.chatId}`}
                className="truncate hover:underline"
              >
                {item.chatTitle}
              </Link>
            </>
          )}
        </div>
      </div>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Open
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={item.url} download={fileName}>
                <Download className="size-4" />
                Download
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
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              file.
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

function GeneratedImageItem({
  item,
  onDelete,
}: {
  item: {
    id: string;
    url: string;
    prompt: string;
    model: string;
    chatId: string | null;
    chatTitle: string | null;
    createdAt: Date;
  };
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50">
        <img
          src={item.url}
          alt={item.prompt}
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-sm">{item.prompt}</div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{item.model}</span>
          <span>·</span>
          <span>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
          {item.chatTitle && (
            <>
              <span>·</span>
              <Link
                href={`/chat/${item.chatId}`}
                className="truncate hover:underline"
              >
                {item.chatTitle}
              </Link>
            </>
          )}
        </div>
      </div>

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Open
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={item.url} download={`generated-${item.id}.png`}>
                <Download className="size-4" />
                Download
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
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              generated image.
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

function ArtifactItem({
  item,
}: {
  item: {
    id: string;
    title: string;
    versionCount: number;
    chatId: string;
    chatTitle: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}) {
  return (
    <Link
      href={`/chat/${item.chatId}?artifact_id=${item.id}`}
      className="group flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <Sparkles className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-sm">{item.title}</div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {item.versionCount > 1 && (
            <>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                v{item.versionCount}
              </span>
              <span>·</span>
            </>
          )}
          <span>
            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
          </span>
          {item.chatTitle && (
            <>
              <span>·</span>
              <span className="truncate">{item.chatTitle}</span>
            </>
          )}
        </div>
      </div>
      <ExternalLink className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function AttachmentsTab({ search }: { search: string }) {
  const utils = api.useUtils();
  const { data, isLoading } = api.attachment.list.useQuery();

  const deleteMutation = api.attachment.delete.useMutation({
    onSuccess: () => {
      utils.attachment.list.invalidate();
      toast.success("File deleted");
    },
    onError: () => {
      toast.error("Failed to delete file");
    },
  });

  const filteredItems = useMemo(() => {
    if (!data?.items || !search.trim()) return data?.items ?? [];
    const query = search.toLowerCase().trim();
    return data.items.filter((item) =>
      getFileName(item.pathname).toLowerCase().includes(query),
    );
  }, [data?.items, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <ItemSkeleton />
        <ItemSkeleton />
        <ItemSkeleton />
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
          <FileText className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">No attachments yet</p>
          <p className="text-muted-foreground text-sm">
            Files you upload in chats will appear here
          </p>
        </div>
      </div>
    );
  }

  if (!filteredItems.length) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {filteredItems.map((item) => (
        <AttachmentItem
          key={item.id}
          item={item}
          onDelete={() => deleteMutation.mutate({ id: item.id })}
        />
      ))}
    </div>
  );
}

function ImagesTab({ search }: { search: string }) {
  const utils = api.useUtils();
  const { data, isLoading } = api.generatedImage.list.useQuery();

  const deleteMutation = api.generatedImage.delete.useMutation({
    onSuccess: () => {
      utils.generatedImage.list.invalidate();
      toast.success("Image deleted");
    },
    onError: () => {
      toast.error("Failed to delete image");
    },
  });

  const filteredItems = useMemo(() => {
    if (!data?.items || !search.trim()) return data?.items ?? [];
    const query = search.toLowerCase().trim();
    return data.items.filter((item) =>
      item.prompt.toLowerCase().includes(query),
    );
  }, [data?.items, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <ItemSkeleton />
        <ItemSkeleton />
        <ItemSkeleton />
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
          <ImageIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">No generated images yet</p>
          <p className="text-muted-foreground text-sm">
            Images you generate with AI will appear here
          </p>
        </div>
      </div>
    );
  }

  if (!filteredItems.length) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {filteredItems.map((item) => (
        <GeneratedImageItem
          key={item.id}
          item={item}
          onDelete={() => deleteMutation.mutate({ id: item.id })}
        />
      ))}
    </div>
  );
}

function ArtifactsTab({ search }: { search: string }) {
  const { data, isLoading } = api.artifact.list.useQuery();

  const filteredItems = useMemo(() => {
    if (!data?.items || !search.trim()) return data?.items ?? [];
    const query = search.toLowerCase().trim();
    return data.items.filter((item) =>
      item.title.toLowerCase().includes(query),
    );
  }, [data?.items, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <ItemSkeleton />
        <ItemSkeleton />
        <ItemSkeleton />
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
          <Sparkles className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">No artifacts yet</p>
          <p className="text-muted-foreground text-sm">
            Interactive content you create with AI will appear here
          </p>
        </div>
      </div>
    );
  }

  if (!filteredItems.length) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {filteredItems.map((item) => (
        <ArtifactItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function LibraryContent() {
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromUrl = searchParams.get("tab");
  const activeTab: TabValue =
    tabFromUrl && VALID_TABS.includes(tabFromUrl as TabValue)
      ? (tabFromUrl as TabValue)
      : "attachments";

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`/library?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-8">
      <div className="flex flex-col gap-6">
        <h1 className="font-medium text-xl tracking-tight">Library</h1>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="attachments" className="flex-1">
              <FileText className="mr-2 size-4" />
              Attachments
            </TabsTrigger>
            <TabsTrigger value="images" className="flex-1">
              <ImageIcon className="mr-2 size-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="artifacts" className="flex-1">
              <Sparkles className="mr-2 size-4" />
              Artifacts
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="attachments" className="mt-0">
              <AttachmentsTab search={search} />
            </TabsContent>
            <TabsContent value="images" className="mt-0">
              <ImagesTab search={search} />
            </TabsContent>
            <TabsContent value="artifacts" className="mt-0">
              <ArtifactsTab search={search} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <LibraryContent />
      </div>
    </AppLayout>
  );
}
