"use client";

import type { AssistantRuntime } from "@assistant-ui/react";
import type { TanStackUIMessage } from "./types";

/**
 * Connection adapter interface from TanStack AI
 */
export interface ConnectionAdapter {
  connect(
    messages: TanStackUIMessage[],
    data?: Record<string, unknown>,
    abortSignal?: AbortSignal,
  ): AsyncIterable<unknown>;
}

/**
 * Options for TanStackChatTransport
 */
export interface TanStackChatTransportOptions {
  /**
   * API endpoint for chat requests.
   * @default '/api/chat'
   */
  api?: string;

  /**
   * Custom fetch options
   */
  fetchOptions?: RequestInit;

  /**
   * Base connection adapter to wrap.
   * If not provided, uses fetchServerSentEvents internally.
   */
  baseConnection?: ConnectionAdapter;
}

/**
 * Tool type from model context
 */
interface ModelContextTool {
  disabled?: boolean;
  type?: string;
  description?: string;
  parameters?: unknown;
}

/**
 * Get enabled tools from model context
 */
const getEnabledTools = (
  tools: Record<string, ModelContextTool> | undefined,
): Record<string, ModelContextTool> => {
  if (!tools) return {};

  return Object.fromEntries(
    Object.entries(tools).filter(
      ([, tool]) => !tool.disabled && tool.type !== "backend",
    ),
  );
};

/**
 * Convert tools to TanStack AI tool format
 */
const toTanStackTools = (
  tools: Record<string, ModelContextTool>,
): Array<{ name: string; description?: string; inputSchema?: unknown }> => {
  return Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: tool.parameters,
  }));
};

/**
 * A connection adapter that wraps another adapter and injects
 * system messages and frontend tools from the assistant-ui context.
 */
export class TanStackChatTransport implements ConnectionAdapter {
  private runtime: AssistantRuntime | undefined;
  private options: TanStackChatTransportOptions;

  constructor(options: TanStackChatTransportOptions = {}) {
    this.options = options;
  }

  /**
   * Set the runtime reference for accessing model context
   */
  setRuntime(runtime: AssistantRuntime): void {
    this.runtime = runtime;
  }

  /**
   * Connect to the chat endpoint with context injection
   */
  async *connect(
    messages: TanStackUIMessage[],
    data?: Record<string, unknown>,
    abortSignal?: AbortSignal,
  ): AsyncIterable<unknown> {
    const context = this.runtime?.thread.getModelContext();
    const enabledTools = getEnabledTools(context?.tools ?? {});
    const toolsArray = toTanStackTools(enabledTools);

    // Prepare system messages
    const systemMessages: TanStackUIMessage[] = context?.system
      ? [
          {
            id: "system",
            role: "system" as const,
            parts: [{ type: "text" as const, content: context.system }],
          },
        ]
      : [];

    // Combine system messages with conversation messages
    const allMessages = [...systemMessages, ...messages];

    // Prepare request body with tools and settings
    const requestBody = {
      messages: allMessages,
      ...(toolsArray.length > 0 && { tools: toolsArray }),
      ...(context?.callSettings && { callSettings: context.callSettings }),
      ...data,
    };

    const api = this.options.api ?? "/api/chat";
    const fetchOptions = this.options.fetchOptions ?? {};

    // Make the request
    const response = await fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
      ...fetchOptions,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Process as Server-Sent Events
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const chunk = JSON.parse(data);
              yield chunk;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith("data: ")) {
        const data = buffer.slice(6);
        if (data !== "[DONE]") {
          try {
            const chunk = JSON.parse(data);
            yield chunk;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Create a connection adapter that wraps fetchServerSentEvents
 * and injects context from assistant-ui
 */
export const createAssistantConnection = (
  options: TanStackChatTransportOptions = {},
): TanStackChatTransport => {
  return new TanStackChatTransport(options);
};
