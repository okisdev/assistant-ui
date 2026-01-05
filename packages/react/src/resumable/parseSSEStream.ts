/**
 * SSE chunk with type and optional delta content.
 */
export interface SSEChunk {
  type: string;
  delta?: string;
  [key: string]: unknown;
}

/**
 * Options for parsing SSE streams.
 */
export interface ParseSSEStreamOptions {
  /**
   * Filter function to select which chunks to include.
   * @default Includes chunks with type "text-delta" and a delta property
   */
  filter?: (chunk: SSEChunk) => boolean;

  /**
   * Extract function to get the text content from a chunk.
   * @default Returns chunk.delta
   */
  extract?: (chunk: SSEChunk) => string;
}

const defaultFilter = (chunk: SSEChunk): boolean =>
  chunk.type === "text-delta" && typeof chunk.delta === "string";

const defaultExtract = (chunk: SSEChunk): string => chunk.delta ?? "";

/**
 * Parse a SSE stream response and extract text content.
 *
 * @example
 * ```typescript
 * // Default usage - extracts text-delta chunks
 * const text = await parseSSEStreamToText(response);
 *
 * // Custom filter and extract
 * const text = await parseSSEStreamToText(response, {
 *   filter: (chunk) => chunk.type === "content",
 *   extract: (chunk) => chunk.content as string,
 * });
 * ```
 */
export async function parseSSEStreamToText(
  response: Response,
  options: ParseSSEStreamOptions = {},
): Promise<string> {
  const filter = options.filter ?? defaultFilter;
  const extract = options.extract ?? defaultExtract;

  const text = await response.text();
  const lines = text.split("\n");
  let result = "";

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;

    const jsonStr = line.slice(6).trim();
    if (!jsonStr || jsonStr === "[DONE]") continue;

    try {
      const chunk = JSON.parse(jsonStr) as SSEChunk;
      if (filter(chunk)) {
        result += extract(chunk);
      }
    } catch {
      // Ignore parse errors
    }
  }

  return result;
}

/**
 * Parse a SSE stream response and return all chunks.
 *
 * @example
 * ```typescript
 * const chunks = await parseSSEStreamToChunks(response);
 * for (const chunk of chunks) {
 *   console.log(chunk.type, chunk.delta);
 * }
 * ```
 */
export async function parseSSEStreamToChunks(
  response: Response,
): Promise<SSEChunk[]> {
  const text = await response.text();
  const lines = text.split("\n");
  const chunks: SSEChunk[] = [];

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;

    const jsonStr = line.slice(6).trim();
    if (!jsonStr || jsonStr === "[DONE]") continue;

    try {
      const chunk = JSON.parse(jsonStr) as SSEChunk;
      chunks.push(chunk);
    } catch {
      // Ignore parse errors
    }
  }

  return chunks;
}
