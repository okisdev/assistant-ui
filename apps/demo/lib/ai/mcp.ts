import { createMCPClient } from "@ai-sdk/mcp";
import { jsonSchema, type ToolSet } from "ai";
import { eq } from "drizzle-orm";
import { api } from "@/utils/trpc/server";
import { database } from "@/lib/database";
import { mcpServer } from "@/lib/database/schema";
import { decrypt, encrypt } from "@/lib/crypto";
import {
  getOAuthAuthorizationHeader,
  isTokenExpired,
  refreshAccessToken,
} from "@/lib/mcp-auth";

type MCPServerConfig = {
  id: string;
  name: string;
  url: string;
  transportType: "http" | "sse";
  headers: Record<string, string> | null;
  oauthClientId: string | null;
  oauthClientSecret: string | null;
  oauthAuthorizationUrl: string | null;
  oauthTokenUrl: string | null;
  oauthScope: string | null;
  oauthAccessToken: string | null;
  oauthRefreshToken: string | null;
  oauthTokenExpiresAt: Date | null;
};

type MCPClientEntry = {
  client: Awaited<ReturnType<typeof createMCPClient>>;
  serverName: string;
};

export type MCPToolInfo = {
  serverName: string;
  toolName: string;
  prefixedName: string;
  description: string;
};

async function refreshTokensIfNeeded(
  server: MCPServerConfig,
): Promise<MCPServerConfig> {
  if (
    !server.oauthRefreshToken ||
    !server.oauthTokenUrl ||
    !server.oauthClientId ||
    !server.oauthClientSecret
  ) {
    return server;
  }

  if (!isTokenExpired(server.oauthTokenExpiresAt)) {
    return server;
  }

  console.log(
    `[MCP] Token expired for "${server.name}", attempting refresh...`,
  );

  try {
    const tokens = await refreshAccessToken(
      {
        clientId: server.oauthClientId,
        clientSecret: decrypt(server.oauthClientSecret),
        authorizationUrl: server.oauthAuthorizationUrl ?? "",
        tokenUrl: server.oauthTokenUrl,
        scope: server.oauthScope ?? undefined,
        redirectUri: "",
      },
      decrypt(server.oauthRefreshToken),
    );

    const expiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    await database
      .update(mcpServer)
      .set({
        oauthAccessToken: encrypt(tokens.accessToken),
        oauthRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : server.oauthRefreshToken,
        oauthTokenExpiresAt: expiresAt,
      })
      .where(eq(mcpServer.id, server.id));

    console.log(`[MCP] Token refreshed for "${server.name}"`);

    return {
      ...server,
      oauthAccessToken: encrypt(tokens.accessToken),
      oauthRefreshToken: tokens.refreshToken
        ? encrypt(tokens.refreshToken)
        : server.oauthRefreshToken,
      oauthTokenExpiresAt: expiresAt,
    };
  } catch (error) {
    console.error(
      `[MCP] Failed to refresh token for "${server.name}":`,
      error instanceof Error ? error.message : error,
    );
    return server;
  }
}

function buildMCPHeaders(
  server: MCPServerConfig,
): Record<string, string> | undefined {
  const headers: Record<string, string> = { ...server.headers };

  if (!headers.Authorization) {
    const oauthHeader = getOAuthAuthorizationHeader(server);
    if (oauthHeader) {
      headers.Authorization = oauthHeader;
    }
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

export async function getMCPTools(): Promise<{
  tools: ToolSet;
  clients: MCPClientEntry[];
  toolInfos: MCPToolInfo[];
}> {
  const tools: ToolSet = {};
  const clients: MCPClientEntry[] = [];
  const toolInfos: MCPToolInfo[] = [];

  let servers: MCPServerConfig[];
  try {
    servers = await api.mcpServer.listEnabled();
  } catch {
    return { tools, clients, toolInfos };
  }

  if (servers.length === 0) {
    return { tools, clients, toolInfos };
  }

  const connectionResults = await Promise.allSettled(
    servers.map(async (server) => {
      const refreshedServer = await refreshTokensIfNeeded(server);
      const headers = buildMCPHeaders(refreshedServer);

      const client = await createMCPClient({
        transport: {
          type: refreshedServer.transportType,
          url: refreshedServer.url,
          headers,
        },
      });

      const serverTools = await client.tools();

      return {
        client,
        serverName: refreshedServer.name,
        tools: serverTools,
      };
    }),
  );

  for (const result of connectionResults) {
    if (result.status === "fulfilled") {
      const { client, serverName, tools: serverTools } = result.value;
      clients.push({ client, serverName });

      const sanitizedServerName = serverName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");

      for (const [toolName, tool] of Object.entries(serverTools)) {
        const toolAny = tool as Record<string, unknown>;
        if (typeof toolAny.execute !== "function") {
          continue;
        }

        const prefixedName = `mcp_${sanitizedServerName}_${toolName}`;
        const inputSchema = toolAny.inputSchema as
          | { jsonSchema?: Record<string, unknown> }
          | undefined;
        const originalSchema = inputSchema?.jsonSchema;

        const validSchema =
          originalSchema?.type === "object"
            ? jsonSchema(originalSchema)
            : jsonSchema({
                type: "object" as const,
                properties: {},
                additionalProperties: true,
              });

        tools[prefixedName] = {
          ...tool,
          inputSchema: validSchema,
        } as unknown as ToolSet[string];

        toolInfos.push({
          serverName,
          toolName,
          prefixedName,
          description: tool.description ?? "",
        });
      }
    } else {
      console.error("[MCP] Failed to connect to MCP server:", result.reason);
    }
  }

  return { tools, clients, toolInfos };
}

export async function closeMCPClients(
  clients: MCPClientEntry[],
): Promise<void> {
  await Promise.allSettled(
    clients.map(({ client }) => client.close().catch(() => {})),
  );
}
