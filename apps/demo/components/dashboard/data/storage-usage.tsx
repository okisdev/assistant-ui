"use client";

import { HardDrive, File, FileImage, FileText, FileVideo } from "lucide-react";

import { api } from "@/utils/trpc/client";
import { Progress } from "@/components/ui/progress";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) {
    return FileImage;
  }
  if (contentType.startsWith("video/")) {
    return FileVideo;
  }
  if (
    contentType.includes("pdf") ||
    contentType.includes("document") ||
    contentType.includes("text")
  ) {
    return FileText;
  }
  return File;
}

function StorageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3"
          >
            <div className="size-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StorageUsage() {
  const { data, isLoading } = api.attachment.getStorageUsage.useQuery();

  if (isLoading) {
    return <StorageSkeleton />;
  }

  const usedBytes = data?.usedBytes ?? 0;
  const limitBytes = data?.limitBytes ?? 100 * 1024 * 1024;
  const percentage = Math.min((usedBytes / limitBytes) * 100, 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Storage Used</span>
          <span className="text-muted-foreground text-sm">
            {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-muted-foreground text-xs">
          {data?.attachmentCount ?? 0} attachments
          {(data?.documentCount ?? 0) > 0 &&
            `, ${data?.documentCount} documents`}
        </p>
      </div>

      {data?.recentAttachments && data.recentAttachments.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-medium text-sm">Recent Files</h3>
          <div className="flex flex-col gap-2">
            {data.recentAttachments.map((file) => {
              const Icon = getFileIcon(file.contentType);
              const fileName = file.pathname.split("/").pop() ?? file.pathname;

              return (
                <div
                  key={file.id}
                  className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{fileName}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(!data?.recentAttachments || data.recentAttachments.length === 0) && (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
            <HardDrive className="size-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No files uploaded yet</p>
        </div>
      )}
    </div>
  );
}
