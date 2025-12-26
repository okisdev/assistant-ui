const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: Array<{
    displayName: string;
    emailAddress: string;
  }>;
  shared?: boolean;
  starred?: boolean;
  trashed?: boolean;
};

export type ListFilesOptions = {
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
  q?: string;
  fields?: string;
  spaces?: string;
  includeItemsFromAllDrives?: boolean;
  supportsAllDrives?: boolean;
};

export type SearchFilesOptions = {
  query: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
};

async function fetchDriveApi<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${DRIVE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Drive API error: ${response.status}`,
    );
  }

  return response.json();
}

const DEFAULT_FILE_FIELDS =
  "id,name,mimeType,description,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink,parents,owners,shared,starred,trashed";

export async function listFiles(
  accessToken: string,
  options: ListFilesOptions = {},
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const {
    pageSize = 10,
    pageToken,
    orderBy = "modifiedTime desc",
    q,
    fields = `nextPageToken,files(${DEFAULT_FILE_FIELDS})`,
    spaces = "drive",
    includeItemsFromAllDrives = false,
    supportsAllDrives = false,
  } = options;

  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    orderBy,
    fields,
    spaces,
    includeItemsFromAllDrives: includeItemsFromAllDrives.toString(),
    supportsAllDrives: supportsAllDrives.toString(),
  });

  if (pageToken) params.set("pageToken", pageToken);
  if (q) params.set("q", q);

  return fetchDriveApi<{ files: DriveFile[]; nextPageToken?: string }>(
    accessToken,
    `/files?${params}`,
  );
}

export async function searchFiles(
  accessToken: string,
  options: SearchFilesOptions,
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const {
    query,
    pageSize = 10,
    pageToken,
    orderBy = "modifiedTime desc",
  } = options;

  const searchQuery = `fullText contains '${query.replace(/'/g, "\\'")}'`;

  return listFiles(accessToken, {
    q: searchQuery,
    pageSize,
    pageToken,
    orderBy,
  });
}

export async function getFile(
  accessToken: string,
  fileId: string,
): Promise<DriveFile> {
  const params = new URLSearchParams({
    fields: DEFAULT_FILE_FIELDS,
    supportsAllDrives: "true",
  });

  return fetchDriveApi<DriveFile>(accessToken, `/files/${fileId}?${params}`);
}

export async function getFileContent(
  accessToken: string,
  fileId: string,
): Promise<string> {
  const file = await getFile(accessToken, fileId);

  // Handle Google Docs export
  if (file.mimeType.startsWith("application/vnd.google-apps.")) {
    const exportMimeType = getExportMimeType(file.mimeType);
    if (!exportMimeType) {
      throw new Error(`Cannot export file type: ${file.mimeType}`);
    }

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to export file: ${response.status}`);
    }

    return response.text();
  }

  // Handle regular files
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";

  // For text-based files, return the content
  if (
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    contentType.includes("javascript")
  ) {
    return response.text();
  }

  // For binary files, return info about the file
  return `[Binary file: ${file.name} (${file.mimeType}, ${formatFileSize(file.size)})]`;
}

function getExportMimeType(googleMimeType: string): string | null {
  const exportMap: Record<string, string> = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
    "application/vnd.google-apps.drawing": "image/png",
  };
  return exportMap[googleMimeType] || null;
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

export type CreateFileInput = {
  name: string;
  mimeType?: string;
  content?: string;
  parents?: string[];
  description?: string;
};

export async function createFile(
  accessToken: string,
  input: CreateFileInput,
): Promise<DriveFile> {
  const {
    name,
    mimeType = "text/plain",
    content,
    parents,
    description,
  } = input;

  // Create file metadata
  const metadata: Record<string, unknown> = {
    name,
    mimeType,
  };
  if (parents) metadata.parents = parents;
  if (description) metadata.description = description;

  if (!content) {
    // Create empty file or folder
    return fetchDriveApi<DriveFile>(
      accessToken,
      `/files?fields=${DEFAULT_FILE_FIELDS}`,
      {
        method: "POST",
        body: JSON.stringify(metadata),
      },
    );
  }

  // Create file with content using multipart upload
  const boundary = "-------drive_upload_boundary";
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${DEFAULT_FILE_FIELDS}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Upload failed: ${response.status}`,
    );
  }

  return response.json();
}

export async function deleteFile(
  accessToken: string,
  fileId: string,
): Promise<void> {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Delete failed: ${response.status}`,
    );
  }
}
