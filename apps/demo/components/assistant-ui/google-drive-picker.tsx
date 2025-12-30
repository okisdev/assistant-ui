"use client";

import { useState, useCallback, useEffect, type FC } from "react";
import {
  FolderIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  FileSpreadsheetIcon,
  PresentationIcon,
  ChevronLeftIcon,
  SearchIcon,
  LoaderIcon,
  CheckIcon,
  XIcon,
  HomeIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { api } from "@/utils/trpc/client";
import type { DriveFileOutput } from "@/server/routers/apps/google-drive";

const MAX_SELECTED_FILES = 5;

type BreadcrumbItem = {
  id: string | null;
  name: string;
};

function getFileIcon(mimeType: string) {
  if (mimeType === "application/vnd.google-apps.folder") {
    return <FolderIcon className="size-5 text-blue-500" />;
  }
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="size-5 text-purple-500" />;
  }
  if (mimeType === "application/pdf") {
    return <FileTextIcon className="size-5 text-red-500" />;
  }
  if (
    mimeType === "application/vnd.google-apps.document" ||
    mimeType.includes("document")
  ) {
    return <FileTextIcon className="size-5 text-blue-600" />;
  }
  if (
    mimeType === "application/vnd.google-apps.spreadsheet" ||
    mimeType.includes("spreadsheet")
  ) {
    return <FileSpreadsheetIcon className="size-5 text-green-600" />;
  }
  if (
    mimeType === "application/vnd.google-apps.presentation" ||
    mimeType.includes("presentation")
  ) {
    return <PresentationIcon className="size-5 text-orange-500" />;
  }
  return <FileIcon className="size-5 text-muted-foreground" />;
}

function formatFileSize(bytes: string | null): string {
  if (!bytes) return "";
  const size = parseInt(bytes, 10);
  if (Number.isNaN(size)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let fileSize = size;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
}

function formatModifiedTime(time: string | null): string {
  if (!time) return "";
  const date = new Date(time);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

type FileListItemProps = {
  file: DriveFileOutput;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onNavigate: () => void;
};

const FileListItem: FC<FileListItemProps> = ({
  file,
  selected,
  disabled,
  onSelect,
  onNavigate,
}) => {
  const handleClick = () => {
    if (file.isFolder) {
      onNavigate();
    } else if (file.isSupported && !disabled) {
      onSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        file.isFolder
          ? "cursor-pointer hover:bg-accent/50"
          : file.isSupported
            ? disabled && !selected
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:bg-accent/50"
            : "cursor-not-allowed opacity-40",
        selected && "bg-accent",
      )}
    >
      {!file.isFolder && (
        <Checkbox
          checked={selected}
          disabled={!file.isSupported || (disabled && !selected)}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={onSelect}
          className="shrink-0"
        />
      )}
      <div className={cn("shrink-0", file.isFolder && "ml-7")}>
        {getFileIcon(file.mimeType)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{file.name}</p>
        {!file.isFolder && (
          <p className="text-muted-foreground text-xs">
            {formatFileSize(file.size)}
            {file.modifiedTime && (
              <>
                <span className="mx-1">·</span>
                {formatModifiedTime(file.modifiedTime)}
              </>
            )}
          </p>
        )}
      </div>
      {file.isFolder && (
        <ChevronLeftIcon className="size-4 rotate-180 text-muted-foreground" />
      )}
    </div>
  );
};

type BreadcrumbNavProps = {
  path: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
};

const BreadcrumbNav: FC<BreadcrumbNavProps> = ({ path, onNavigate }) => {
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <HomeIcon className="size-3.5" />
        <span>My Drive</span>
      </button>
      {path.map((item, index) => (
        <div key={item.id ?? "root"} className="flex items-center gap-1">
          <ChevronLeftIcon className="size-3.5 rotate-180 text-muted-foreground" />
          {index === path.length - 1 ? (
            <span className="rounded px-1.5 py-0.5 font-medium">
              {item.name}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              className="rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

type FileListSkeletonProps = {
  count?: number;
};

const FileListSkeleton: FC<FileListSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="size-4 animate-pulse rounded bg-muted" />
          <div className="size-5 animate-pulse rounded bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
};

export type ImportedAttachment = {
  id: string;
  url: string;
  name: string;
  contentType: string;
};

type GoogleDrivePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (attachments: ImportedAttachment[]) => void;
};

export const GoogleDrivePicker: FC<GoogleDrivePickerProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const isSearchMode = searchQuery.length > 0;

  const {
    data: listData,
    isLoading: isListLoading,
    error: listError,
  } = api.apps.googleDrive.listFiles.useQuery(
    { folderId: currentFolderId ?? undefined },
    { enabled: open && !isSearchMode },
  );

  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
  } = api.apps.googleDrive.searchFiles.useQuery(
    { query: searchQuery },
    { enabled: open && isSearchMode && searchQuery.length >= 2 },
  );

  const { data: pathData } = api.apps.googleDrive.getFolderPath.useQuery(
    { folderId: currentFolderId! },
    { enabled: open && !!currentFolderId },
  );

  const importMutation = api.apps.googleDrive.importFiles.useMutation({
    onSuccess: (data) => {
      const successfulImports = data.results
        .filter((r) => r.success && r.attachment)
        .map((r) => r.attachment!);

      if (successfulImports.length > 0) {
        onImport(successfulImports);
      }

      setSelectedFileIds(new Set());
      setCurrentFolderId(null);
      setFolderPath([]);
      setSearchQuery("");
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (pathData) {
      setFolderPath(pathData);
    } else if (!currentFolderId) {
      setFolderPath([]);
    }
  }, [pathData, currentFolderId]);

  const files = isSearchMode ? searchData?.files : listData?.files;
  const isLoading = isSearchMode ? isSearchLoading : isListLoading;
  const error = isSearchMode ? searchError : listError;
  const canSelectMore = selectedFileIds.size < MAX_SELECTED_FILES;

  const handleNavigate = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedFileIds(new Set());
    if (!folderId) {
      setFolderPath([]);
    }
  }, []);

  const handleFolderClick = useCallback((folder: DriveFileOutput) => {
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setSelectedFileIds(new Set());
  }, []);

  const handleToggleFile = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else if (next.size < MAX_SELECTED_FILES) {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const handleImport = useCallback(() => {
    if (selectedFileIds.size === 0) return;
    importMutation.mutate({ fileIds: Array.from(selectedFileIds) });
  }, [selectedFileIds, importMutation]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleBack = () => {
    if (isSearchMode) {
      handleClearSearch();
    } else if (folderPath.length > 0) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1]?.id ?? null);
    }
  };

  const showBackButton = isSearchMode || folderPath.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src="/apps/icons/Google_Drive.svg" alt="" className="size-5" />
            Select from Google Drive
          </DialogTitle>
          <DialogDescription className="sr-only">
            Browse and select files from your Google Drive to import as
            attachments
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pr-9 pl-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={handleBack}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              {isSearchMode ? (
                <span className="text-muted-foreground text-sm">
                  Search results for "{searchQuery}"
                </span>
              ) : (
                <BreadcrumbNav path={folderPath} onNavigate={handleNavigate} />
              )}
            </div>
          </div>

          <ScrollArea className="h-[280px] rounded-lg bg-muted/30">
            <div className="p-1">
              {isLoading ? (
                <FileListSkeleton />
              ) : error ? (
                <div className="flex h-[250px] flex-col items-center justify-center gap-2 text-muted-foreground">
                  <p className="text-sm">Failed to load files</p>
                  <p className="text-xs">{error.message}</p>
                </div>
              ) : !files || files.length === 0 ? (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                  {isSearchMode ? "No files found" : "This folder is empty"}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {files.map((file) => (
                    <FileListItem
                      key={file.id}
                      file={file}
                      selected={selectedFileIds.has(file.id)}
                      disabled={!canSelectMore}
                      onSelect={() => handleToggleFile(file.id)}
                      onNavigate={() => handleFolderClick(file)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-4 sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {selectedFileIds.size} of {MAX_SELECTED_FILES} files selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedFileIds.size === 0 || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  Import{" "}
                  {selectedFileIds.size > 0 && `(${selectedFileIds.size})`}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
