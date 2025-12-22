/**
 * Project document adapter for uploading documents to a project's knowledge base.
 * Supports text extraction for various file types.
 */

const TEXT_CONTENT_TYPES = [
  "text/plain",
  "text/html",
  "text/markdown",
  "text/csv",
  "text/css",
  "text/javascript",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
];

const CODE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".php",
  ".swift",
  ".kt",
  ".scala",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".env",
  ".md",
  ".mdx",
  ".rst",
  ".txt",
];

/**
 * Check if a file is a text-based file that can have its content extracted.
 */
export function isTextFile(file: File): boolean {
  // Check content type
  if (TEXT_CONTENT_TYPES.some((type) => file.type.startsWith(type))) {
    return true;
  }

  // Check file extension
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (CODE_EXTENSIONS.includes(extension)) {
    return true;
  }

  return false;
}

/**
 * Extract text content from a file.
 * Currently supports text-based files.
 * PDF extraction would require a server-side library.
 */
export async function extractTextFromFile(file: File): Promise<string | null> {
  if (!isTextFile(file)) {
    // For PDFs and other binary formats, we'd need server-side processing
    // Return null to indicate extraction not supported client-side
    if (file.type === "application/pdf") {
      return null; // PDF extraction requires server-side processing
    }
    return null;
  }

  try {
    const text = await file.text();
    // Limit extracted text to avoid extremely large content
    const MAX_TEXT_LENGTH = 100000; // 100KB of text
    if (text.length > MAX_TEXT_LENGTH) {
      return `${text.slice(0, MAX_TEXT_LENGTH)}\n\n[Content truncated...]`;
    }
    return text;
  } catch {
    return null;
  }
}

export type ProjectDocumentUploadResult = {
  id: string;
  name: string;
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  extractedText: string | null;
};

/**
 * Upload a document to a project's knowledge base.
 */
export async function uploadProjectDocument(
  projectId: string,
  file: File,
): Promise<ProjectDocumentUploadResult> {
  // Extract text content client-side for supported formats
  const extractedText = await extractTextFromFile(file);

  // Upload file to blob storage
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);

  const response = await fetch("/api/upload/project-document", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }

  const result = (await response.json()) as {
    id: string;
    url: string;
    pathname: string;
  };

  return {
    id: result.id,
    name: file.name,
    url: result.url,
    pathname: result.pathname,
    contentType: file.type,
    size: file.size,
    extractedText,
  };
}

/**
 * Get accepted file types for project documents.
 */
export const ACCEPTED_DOCUMENT_TYPES = [
  // Text files
  ".txt",
  ".md",
  ".mdx",
  ".rst",
  // Code files
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".cs",
  ".php",
  ".swift",
  ".kt",
  // Config files
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".csv",
  // Documents
  ".pdf",
].join(",");
