"use client";

import { useState, useRef, useCallback, useEffect, type FC } from "react";
import Link from "next/link";
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
  UploadIcon,
  LibraryIcon,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/utils/trpc/client";
import type { DriveFileOutput } from "@/server/routers/apps/google-drive";

const MAX_SELECTED_FILES = 5;
const GOOGLE_DRIVE_APP_ID = "app_google_drive";

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

function formatFileSize(bytes: number | string | null): string {
  if (!bytes) return "";
  const size = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
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

type DriveFileListItemProps = {
  file: DriveFileOutput;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onNavigate: () => void;
};

const DriveFileListItem: FC<DriveFileListItemProps> = ({
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
        {!file.isFolder && file.size && (
          <p className="text-muted-foreground text-xs">
            {formatFileSize(file.size)}
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

const FileListSkeleton: FC<{ count?: number }> = ({ count = 5 }) => {
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

type LibraryFile = {
  id: string;
  url: string;
  pathname: string;
  contentType: string;
  size: number | null;
};

type LibraryFileListItemProps = {
  file: LibraryFile;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
};

const LibraryFileListItem: FC<LibraryFileListItemProps> = ({
  file,
  selected,
  disabled,
  onSelect,
}) => {
  const filename = file.pathname.split("/").pop() || file.pathname;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && onSelect()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) onSelect();
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50",
        disabled && !selected && "cursor-not-allowed opacity-50",
        selected && "bg-accent",
      )}
    >
      <Checkbox
        checked={selected}
        disabled={disabled && !selected}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={onSelect}
        className="shrink-0"
      />
      <div className="shrink-0">{getFileIcon(file.contentType)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{filename}</p>
        <p className="text-muted-foreground text-xs">
          {formatFileSize(file.size)}
        </p>
      </div>
    </div>
  );
};

export type DocumentPickerResult = {
  name: string;
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  extractedText?: string | null;
};

type DocumentPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onImport: (documents: DocumentPickerResult[]) => void;
  acceptedTypes?: string;
};

export const DocumentPicker: FC<DocumentPickerProps> = ({
  open,
  onOpenChange,
  projectId,
  onImport,
  acceptedTypes,
}) => {
  const [activeTab, setActiveTab] = useState<"local" | "drive" | "library">(
    "local",
  );

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([]);
  const [selectedDriveFileIds, setSelectedDriveFileIds] = useState<Set<string>>(
    new Set(),
  );
  const [driveSearchQuery, setDriveSearchQuery] = useState("");

  const [selectedLibraryFileIds, setSelectedLibraryFileIds] = useState<
    Set<string>
  >(new Set());
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { data: connections } = api.apps.application.userConnections.useQuery();
  const googleDriveConnection = connections?.find(
    (c) => c.applicationId === GOOGLE_DRIVE_APP_ID,
  );
  const isGoogleDriveConnected =
    googleDriveConnection?.isConnected && googleDriveConnection?.enabled;

  const isDriveSearchMode = driveSearchQuery.length > 0;

  const { data: driveListData, isLoading: isDriveListLoading } =
    api.apps.googleDrive.listFiles.useQuery(
      { folderId: currentFolderId ?? undefined },
      { enabled: open && activeTab === "drive" && !isDriveSearchMode },
    );

  const { data: driveSearchData, isLoading: isDriveSearchLoading } =
    api.apps.googleDrive.searchFiles.useQuery(
      { query: driveSearchQuery },
      {
        enabled:
          open &&
          activeTab === "drive" &&
          isDriveSearchMode &&
          driveSearchQuery.length >= 2,
      },
    );

  const { data: pathData } = api.apps.googleDrive.getFolderPath.useQuery(
    { folderId: currentFolderId! },
    { enabled: open && activeTab === "drive" && !!currentFolderId },
  );

  const driveImportMutation =
    api.apps.googleDrive.importFilesToProject.useMutation({
      onSuccess: (data) => {
        const successfulImports = data.results
          .filter((r: any) => r.success && r.document)
          .map((r: any) => r.document as DocumentPickerResult);

        if (successfulImports.length > 0) {
          onImport(successfulImports);
        }

        resetAndClose();
      },
    });

  const { data: libraryFiles, isLoading: isLibraryLoading } =
    api.attachment.list.useQuery({ limit: 50 }, { enabled: open });

  const filteredLibraryFiles =
    libraryFiles?.items.filter((f) => {
      if (!librarySearchQuery) return true;
      const filename = f.pathname.split("/").pop() || "";
      return filename.toLowerCase().includes(librarySearchQuery.toLowerCase());
    }) ?? [];

  useEffect(() => {
    if (pathData) {
      setFolderPath(pathData);
    } else if (!currentFolderId) {
      setFolderPath([]);
    }
  }, [pathData, currentFolderId]);

  const driveFiles = isDriveSearchMode
    ? driveSearchData?.files
    : driveListData?.files;
  const isDriveLoading = isDriveSearchMode
    ? isDriveSearchLoading
    : isDriveListLoading;

  const totalSelected = selectedDriveFileIds.size + selectedLibraryFileIds.size;
  const canSelectMore = totalSelected < MAX_SELECTED_FILES;

  const resetAndClose = useCallback(() => {
    setSelectedDriveFileIds(new Set());
    setSelectedLibraryFileIds(new Set());
    setCurrentFolderId(null);
    setFolderPath([]);
    setDriveSearchQuery("");
    setLibrarySearchQuery("");
    onOpenChange(false);
  }, [onOpenChange]);

  const handleDriveNavigate = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedDriveFileIds(new Set());
    if (!folderId) {
      setFolderPath([]);
    }
  }, []);

  const handleDriveFolderClick = useCallback((folder: DriveFileOutput) => {
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
    setSelectedDriveFileIds(new Set());
  }, []);

  const handleToggleDriveFile = useCallback(
    (fileId: string) => {
      setSelectedDriveFileIds((prev) => {
        const next = new Set(prev);
        if (next.has(fileId)) {
          next.delete(fileId);
        } else if (
          next.size + selectedLibraryFileIds.size <
          MAX_SELECTED_FILES
        ) {
          next.add(fileId);
        }
        return next;
      });
    },
    [selectedLibraryFileIds.size],
  );

  const handleToggleLibraryFile = useCallback(
    (fileId: string) => {
      setSelectedLibraryFileIds((prev) => {
        const next = new Set(prev);
        if (next.has(fileId)) {
          next.delete(fileId);
        } else if (next.size + selectedDriveFileIds.size < MAX_SELECTED_FILES) {
          next.add(fileId);
        }
        return next;
      });
    },
    [selectedDriveFileIds.size],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsUploading(true);
      const results: DocumentPickerResult[] = [];

      try {
        for (const file of files.slice(0, MAX_SELECTED_FILES)) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("projectId", projectId);

          const response = await fetch("/api/upload/project-document", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const result = (await response.json()) as {
            id: string;
            url: string;
            pathname: string;
          };

          let extractedText: string | null = null;
          if (
            file.type.startsWith("text/") ||
            file.name.match(/\.(txt|md|json|csv|xml)$/i)
          ) {
            try {
              extractedText = await file.text();
              if (extractedText.length > 100000) {
                extractedText = `${extractedText.slice(0, 100000)}\n\n[Content truncated...]`;
              }
            } catch {
              extractedText = null;
            }
          }

          results.push({
            name: file.name,
            url: result.url,
            pathname: result.pathname,
            contentType: file.type,
            size: file.size,
            extractedText,
          });
        }

        if (results.length > 0) {
          onImport(results);
          resetAndClose();
        }
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [projectId, onImport, resetAndClose],
  );

  const handleLocalUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      await uploadFiles(Array.from(files));
    },
    [uploadFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await uploadFiles(files);
      }
    },
    [uploadFiles],
  );

  const handleImport = useCallback(() => {
    if (selectedDriveFileIds.size > 0) {
      driveImportMutation.mutate({
        projectId,
        fileIds: Array.from(selectedDriveFileIds),
      });
    }

    if (selectedLibraryFileIds.size > 0 && libraryFiles) {
      const selectedLibrary = libraryFiles.items
        .filter((f) => selectedLibraryFileIds.has(f.id))
        .map((f) => ({
          name: f.pathname.split("/").pop() || f.pathname,
          url: f.url,
          pathname: f.pathname,
          contentType: f.contentType,
          size: f.size ?? 0,
        }));

      if (selectedLibrary.length > 0 && selectedDriveFileIds.size === 0) {
        onImport(selectedLibrary);
        resetAndClose();
      }
    }
  }, [
    selectedDriveFileIds,
    selectedLibraryFileIds,
    libraryFiles,
    projectId,
    driveImportMutation,
    onImport,
    resetAndClose,
  ]);

  const handleDriveBack = () => {
    if (isDriveSearchMode) {
      setDriveSearchQuery("");
    } else if (folderPath.length > 0) {
      const newPath = folderPath.slice(0, -1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1]?.id ?? null);
    }
  };

  const showDriveBackButton = isDriveSearchMode || folderPath.length > 0;
  const isImporting = driveImportMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Documents</DialogTitle>
          <DialogDescription className="sr-only">
            Upload documents from local file, Google Drive, or your library
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="mb-3 grid w-full grid-cols-3">
            <TabsTrigger value="local" className="gap-2">
              <UploadIcon className="size-4" />
              Local
            </TabsTrigger>
            <TabsTrigger value="drive" className="gap-2">
              <img
                src="/apps/icons/Google_Drive.svg"
                alt=""
                className="size-4"
              />
              Drive
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <LibraryIcon className="size-4" />
              Library
            </TabsTrigger>
          </TabsList>

          <div className="relative h-[350px]">
            <TabsContent
              value="local"
              className="absolute inset-0 mt-0 data-[state=inactive]:hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes}
                onChange={handleLocalUpload}
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-4 rounded-lg transition-colors",
                  isDragging
                    ? "bg-primary/10 ring-2 ring-primary ring-offset-2"
                    : "bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "flex size-16 items-center justify-center rounded-full transition-colors",
                    isDragging ? "bg-primary/20" : "bg-muted/50",
                  )}
                >
                  <UploadIcon
                    className={cn(
                      "size-8 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium">
                    {isDragging ? "Drop files here" : "Upload from your device"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Drag & drop or select up to {MAX_SELECTED_FILES} files
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <LoaderIcon className="size-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="size-4" />
                      Choose Files
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent
              value="drive"
              className="absolute inset-0 mt-0 flex flex-col gap-3 overflow-hidden data-[state=inactive]:hidden"
            >
              {!isGoogleDriveConnected ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg bg-muted/30">
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
                    <img
                      src="/apps/icons/Google_Drive.svg"
                      alt=""
                      className="size-8"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Connect Google Drive</p>
                    <p className="text-muted-foreground text-sm">
                      Access your files from Google Drive
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/apps/google-drive">Connect</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      className="pr-9 pl-9"
                    />
                    {driveSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setDriveSearchQuery("")}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {showDriveBackButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        onClick={handleDriveBack}
                      >
                        <ChevronLeftIcon className="size-4" />
                      </Button>
                    )}
                    <div className="min-w-0 flex-1">
                      {isDriveSearchMode ? (
                        <span className="text-muted-foreground text-sm">
                          Search results for "{driveSearchQuery}"
                        </span>
                      ) : (
                        <BreadcrumbNav
                          path={folderPath}
                          onNavigate={handleDriveNavigate}
                        />
                      )}
                    </div>
                  </div>

                  <ScrollArea className="flex-1 rounded-lg bg-muted/30">
                    <div className="p-1">
                      {isDriveLoading ? (
                        <FileListSkeleton />
                      ) : !driveFiles || driveFiles.length === 0 ? (
                        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                          {isDriveSearchMode
                            ? "No files found"
                            : "This folder is empty"}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {driveFiles.map((file) => (
                            <DriveFileListItem
                              key={file.id}
                              file={file}
                              selected={selectedDriveFileIds.has(file.id)}
                              disabled={!canSelectMore}
                              onSelect={() => handleToggleDriveFile(file.id)}
                              onNavigate={() => handleDriveFolderClick(file)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            <TabsContent
              value="library"
              className="absolute inset-0 mt-0 flex flex-col gap-3 overflow-hidden data-[state=inactive]:hidden"
            >
              <div className="relative">
                <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search your files..."
                  value={librarySearchQuery}
                  onChange={(e) => setLibrarySearchQuery(e.target.value)}
                  className="pr-9 pl-9"
                />
                {librarySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLibrarySearchQuery("")}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-4" />
                  </button>
                )}
              </div>

              <ScrollArea className="flex-1 rounded-lg bg-muted/30">
                <div className="p-1">
                  {isLibraryLoading ? (
                    <FileListSkeleton />
                  ) : filteredLibraryFiles.length === 0 ? (
                    <div className="flex h-[250px] flex-col items-center justify-center gap-2 text-muted-foreground">
                      <LibraryIcon className="size-8" />
                      <p className="text-sm">
                        {librarySearchQuery
                          ? "No files found"
                          : "No files in library"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {filteredLibraryFiles.map((file) => (
                        <LibraryFileListItem
                          key={file.id}
                          file={file}
                          selected={selectedLibraryFileIds.has(file.id)}
                          disabled={!canSelectMore}
                          onSelect={() => handleToggleLibraryFile(file.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex-row items-center justify-between gap-4 sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {totalSelected} of {MAX_SELECTED_FILES} files selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={totalSelected === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <LoaderIcon className="size-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" />
                  Import {totalSelected > 0 && `(${totalSelected})`}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
