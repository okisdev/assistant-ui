import { z } from "zod";
import type { ToolSet } from "ai";
import {
  listFiles,
  searchFiles,
  getFile,
  getFileContent,
  type DriveFile,
} from "@/lib/integrations/google-drive";

export const listDriveFilesSchema = z.object({
  pageSize: z
    .number()
    .optional()
    .default(10)
    .describe("Number of files to return (default: 10, max: 100)"),
  folderOnly: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, only return folders"),
  folderId: z
    .string()
    .optional()
    .describe("ID of folder to list files from. Leave empty for root."),
});

export const searchDriveFilesSchema = z.object({
  query: z.string().describe("Search query to find files"),
  pageSize: z
    .number()
    .optional()
    .default(10)
    .describe("Number of results to return (default: 10)"),
});

export const getDriveFileSchema = z.object({
  fileId: z.string().describe("The ID of the file to get information about"),
});

export const getDriveFileContentSchema = z.object({
  fileId: z.string().describe("The ID of the file to read content from"),
});

function formatFileForDisplay(file: DriveFile): string {
  const parts = [
    `File: ${file.name}`,
    `  ID: ${file.id}`,
    `  Type: ${formatMimeType(file.mimeType)}`,
  ];

  if (file.size) {
    parts.push(`  Size: ${formatFileSize(file.size)}`);
  }
  if (file.modifiedTime) {
    parts.push(`  Modified: ${new Date(file.modifiedTime).toLocaleString()}`);
  }
  if (file.owners?.length) {
    parts.push(
      `  Owner: ${file.owners[0].displayName || file.owners[0].emailAddress}`,
    );
  }
  if (file.webViewLink) {
    parts.push(`  Link: ${file.webViewLink}`);
  }
  if (file.shared) {
    parts.push(`  Shared: Yes`);
  }
  if (file.starred) {
    parts.push(`  Starred: Yes`);
  }

  return parts.join("\n");
}

function formatMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "application/vnd.google-apps.folder": "Folder",
    "application/vnd.google-apps.document": "Google Doc",
    "application/vnd.google-apps.spreadsheet": "Google Sheet",
    "application/vnd.google-apps.presentation": "Google Slides",
    "application/vnd.google-apps.drawing": "Google Drawing",
    "application/vnd.google-apps.form": "Google Form",
    "application/pdf": "PDF",
    "text/plain": "Text File",
    "text/html": "HTML",
    "text/csv": "CSV",
    "application/json": "JSON",
    "image/jpeg": "JPEG Image",
    "image/png": "PNG Image",
    "image/gif": "GIF Image",
    "video/mp4": "MP4 Video",
    "audio/mpeg": "MP3 Audio",
  };
  return mimeMap[mimeType] || mimeType;
}

function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return "unknown size";
  const size = parseInt(bytes, 10);
  if (Number.isNaN(size)) return "unknown size";

  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let fileSize = size;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
}

export function createGoogleDriveTools(accessToken: string): ToolSet {
  return {
    app_google_drive_list_files: {
      description:
        "List files and folders in Google Drive. Use this to browse the user's files, see recent documents, or explore folder contents.",
      inputSchema: listDriveFilesSchema,
      execute: async ({
        pageSize,
        folderOnly,
        folderId,
      }: z.infer<typeof listDriveFilesSchema>) => {
        try {
          let query = "trashed = false";

          if (folderOnly) {
            query += " and mimeType = 'application/vnd.google-apps.folder'";
          }

          if (folderId) {
            query += ` and '${folderId}' in parents`;
          }

          const result = await listFiles(accessToken, {
            pageSize,
            q: query,
          });

          if (result.files.length === 0) {
            return "No files found.";
          }

          const formatted = result.files.map(formatFileForDisplay).join("\n\n");
          return `Found ${result.files.length} file(s):\n\n${formatted}`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return `Failed to list Drive files: ${message}`;
        }
      },
    },

    app_google_drive_search_files: {
      description:
        "Search for files in Google Drive by name or content. Use this to find specific documents, spreadsheets, or other files.",
      inputSchema: searchDriveFilesSchema,
      execute: async ({
        query,
        pageSize,
      }: z.infer<typeof searchDriveFilesSchema>) => {
        try {
          const result = await searchFiles(accessToken, {
            query,
            pageSize,
          });

          if (result.files.length === 0) {
            return `No files found matching "${query}".`;
          }

          const formatted = result.files.map(formatFileForDisplay).join("\n\n");
          return `Found ${result.files.length} file(s) matching "${query}":\n\n${formatted}`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return `Failed to search Drive files: ${message}`;
        }
      },
    },

    app_google_drive_get_file: {
      description:
        "Get detailed information about a specific file in Google Drive, including its metadata, sharing status, and link.",
      inputSchema: getDriveFileSchema,
      execute: async ({ fileId }: z.infer<typeof getDriveFileSchema>) => {
        try {
          const file = await getFile(accessToken, fileId);
          return `File details:\n\n${formatFileForDisplay(file)}`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return `Failed to get file details: ${message}`;
        }
      },
    },

    app_google_drive_get_file_content: {
      description:
        "Read the content of a file from Google Drive. Works with text files, Google Docs, Sheets (as CSV), and other text-based formats. Binary files will return their metadata instead.",
      inputSchema: getDriveFileContentSchema,
      execute: async ({
        fileId,
      }: z.infer<typeof getDriveFileContentSchema>) => {
        try {
          const file = await getFile(accessToken, fileId);
          const content = await getFileContent(accessToken, fileId);

          return `Content of "${file.name}":\n\n${content}`;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          return `Failed to read file content: ${message}`;
        }
      },
    },
  };
}
