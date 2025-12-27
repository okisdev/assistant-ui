"use client";

import type { FC } from "react";
import { AppWindow, Terminal } from "lucide-react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { useSidePanel } from "@/contexts/side-panel-provider";
import { MCPAppRenderer } from "./mcp-app-renderer";

type MCPResourceContent = {
  type: "resource";
  resource: {
    uri: string;
    mimeType: string;
    text: string;
  };
};

type MCPTextContent = {
  type: "text";
  text: string;
};

type MCPToolResult = {
  content: (MCPResourceContent | MCPTextContent)[];
};

function extractHtmlFromResult(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;

  const mcpResult = result as MCPToolResult;
  if (!Array.isArray(mcpResult.content)) return null;

  for (const item of mcpResult.content) {
    if (
      item.type === "resource" &&
      item.resource?.mimeType === "text/html" &&
      typeof item.resource.text === "string"
    ) {
      return item.resource.text;
    }
  }

  return null;
}

function extractTextFromResult(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;

  const mcpResult = result as MCPToolResult;
  if (!Array.isArray(mcpResult.content)) return null;

  const texts: string[] = [];
  for (const item of mcpResult.content) {
    if (item.type === "text" && typeof item.text === "string") {
      texts.push(item.text);
    }
  }

  return texts.length > 0 ? texts.join("\n") : null;
}

function extractTitleFromResult(result: unknown): string {
  if (!result || typeof result !== "object") return "MCP App";

  const mcpResult = result as MCPToolResult;
  if (!Array.isArray(mcpResult.content)) return "MCP App";

  for (const item of mcpResult.content) {
    if (item.type === "resource" && item.resource?.uri) {
      const uri = item.resource.uri;
      if (uri.startsWith("app://")) {
        return uri
          .slice(6)
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }
  }

  return "MCP App";
}

function formatToolName(toolName: string): string {
  return toolName
    .replace(/^mcp_[^_]+_/, "")
    .replace(/^app_[^_]+_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const MCPAppToolFallback: FC<ToolCallMessagePartProps> = ({
  toolName,
  result,
  status,
}) => {
  const { openPanel } = useSidePanel();

  if (!toolName.startsWith("mcp_") && !toolName.startsWith("app_")) {
    return null;
  }

  if (status.type === "running") {
    return null;
  }

  const html = extractHtmlFromResult(result);

  if (html) {
    const title = extractTitleFromResult(result);

    const handleExpand = () => {
      openPanel({
        type: "artifact",
        title,
        content: html,
        artifactType: "html",
      });
    };

    return (
      <div className="group my-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted/50">
            <AppWindow className="size-3.5 text-muted-foreground" />
          </div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        <MCPAppRenderer
          html={html}
          title={title}
          onExpand={handleExpand}
          minHeight={150}
        />
      </div>
    );
  }

  const text = extractTextFromResult(result);

  if (text) {
    const displayName = formatToolName(toolName);

    return (
      <div className="my-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-muted/50">
            <Terminal className="size-3.5 text-muted-foreground" />
          </div>
          <span className="font-medium text-sm">{displayName}</span>
        </div>
        <div className="rounded-xl bg-muted/30 p-4">
          <pre className="whitespace-pre-wrap font-mono text-muted-foreground text-xs">
            {text}
          </pre>
        </div>
      </div>
    );
  }

  return null;
};
