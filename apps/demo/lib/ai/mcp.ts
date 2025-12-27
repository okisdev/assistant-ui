import { createMCPClient } from "@ai-sdk/mcp";
import { jsonSchema, type ToolSet } from "ai";
import { api } from "@/utils/trpc/server";
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
  toolsCache: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }> | null;
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

type ActiveConnection = {
  client: Awaited<ReturnType<typeof createMCPClient>>;
  tools: Record<string, unknown>;
  expiresAt: number;
};

const CONNECTION_CACHE = new Map<string, ActiveConnection>();
const CACHE_TTL = 5 * 60 * 1000;
const MCP_CONNECT_TIMEOUT = 5000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  name: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms),
    ),
  ]);
}

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

    const encryptedAccessToken = encrypt(tokens.accessToken);
    const encryptedRefreshToken = tokens.refreshToken
      ? encrypt(tokens.refreshToken)
      : server.oauthRefreshToken;

    await api.mcpServer.updateOAuthTokens({
      id: server.id,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
    });

    return {
      ...server,
      oauthAccessToken: encryptedAccessToken,
      oauthRefreshToken: encryptedRefreshToken,
      oauthTokenExpiresAt: expiresAt,
    };
  } catch {
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

async function getOrCreateConnection(
  server: MCPServerConfig,
): Promise<ActiveConnection> {
  const cached = CONNECTION_CACHE.get(server.id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const refreshedServer = await refreshTokensIfNeeded(server);
  const headers = buildMCPHeaders(refreshedServer);

  const client = await withTimeout(
    createMCPClient({
      transport: {
        type: refreshedServer.transportType,
        url: refreshedServer.url,
        headers,
      },
    }),
    MCP_CONNECT_TIMEOUT,
    `MCP connect to ${server.name}`,
  );

  const tools = await withTimeout(
    client.tools(),
    MCP_CONNECT_TIMEOUT,
    `MCP tools from ${server.name}`,
  );

  const connection: ActiveConnection = {
    client,
    tools,
    expiresAt: Date.now() + CACHE_TTL,
  };

  CONNECTION_CACHE.set(server.id, connection);
  return connection;
}

function createLazyTool(
  server: MCPServerConfig,
  toolName: string,
  toolDescription: string,
  toolInputSchema: Record<string, unknown>,
): ToolSet[string] {
  const validSchema =
    toolInputSchema.type === "object"
      ? jsonSchema(toolInputSchema)
      : jsonSchema({
          type: "object" as const,
          properties: {},
          additionalProperties: true,
        });

  return {
    description: toolDescription,
    inputSchema: validSchema,
    execute: async (args: unknown) => {
      const connection = await getOrCreateConnection(server);
      const tool = connection.tools[toolName] as {
        execute?: (args: unknown) => Promise<unknown>;
      };

      if (!tool?.execute) {
        throw new Error(`Tool ${toolName} not found on server ${server.name}`);
      }

      return tool.execute(args);
    },
  } as unknown as ToolSet[string];
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

  for (const server of servers) {
    const sanitizedServerName = server.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    if (server.toolsCache && server.toolsCache.length > 0) {
      for (const cachedTool of server.toolsCache) {
        const prefixedName = `mcp_${sanitizedServerName}_${cachedTool.name}`;

        tools[prefixedName] = createLazyTool(
          server,
          cachedTool.name,
          cachedTool.description,
          cachedTool.inputSchema,
        );

        toolInfos.push({
          serverName: server.name,
          toolName: cachedTool.name,
          prefixedName,
          description: cachedTool.description,
        });
      }
    }
  }

  return { tools, clients, toolInfos };
}

export async function closeMCPClients(
  _clients: MCPClientEntry[],
): Promise<void> {}

export function clearMCPCache(): void {
  for (const conn of CONNECTION_CACHE.values()) {
    conn.client.close().catch(() => {});
  }
  CONNECTION_CACHE.clear();
}
