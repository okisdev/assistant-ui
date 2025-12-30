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

const TEXT_EXTENSIONS = [".txt", ".md", ".mdx", ".rst"];

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
];

const CONFIG_EXTENSIONS = [
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".ini",
  ".cfg",
  ".conf",
  ".env",
  ".csv",
];

const ALL_TEXT_EXTENSIONS = [
  ...TEXT_EXTENSIONS,
  ...CODE_EXTENSIONS,
  ...CONFIG_EXTENSIONS,
];

export function isTextFile(file: File): boolean {
  if (TEXT_CONTENT_TYPES.some((type) => file.type.startsWith(type))) {
    return true;
  }

  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return ALL_TEXT_EXTENSIONS.includes(extension);
}

export async function extractTextFromFile(file: File): Promise<string | null> {
  if (!isTextFile(file)) {
    return null;
  }

  try {
    const text = await file.text();
    const MAX_TEXT_LENGTH = 100000;
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

export async function uploadProjectDocument(
  projectId: string,
  file: File,
): Promise<ProjectDocumentUploadResult> {
  const extractedText = await extractTextFromFile(file);

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

export const ACCEPTED_DOCUMENT_TYPES = [
  ...TEXT_EXTENSIONS,
  ...CODE_EXTENSIONS,
  ...CONFIG_EXTENSIONS,
  ".pdf",
].join(",");
