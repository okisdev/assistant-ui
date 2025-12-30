import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createMCPClient } from "@ai-sdk/mcp";
import { TRPCError } from "@trpc/server";

import {
  mcpServer,
  type MCPTransportType,
  type MCPCachedTool,
} from "@/lib/database/schema";
import {
  getOAuthAuthorizationHeader,
  discoverOAuthMetadata,
  registerOAuthClient,
  exchangeCodeForTokens,
} from "@/lib/mcp-auth";
import { encrypt, decrypt } from "@/lib/crypto";
import { protectedProcedure, createTRPCRouter } from "../../trpc";

const MCP_CONNECTION_TIMEOUT_MS = 10000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

type ServerConfig = {
  url: string;
  transportType: "http" | "sse";
  headers: Record<string, string> | null;
  oauthAccessToken: string | null;
  oauthClientId: string | null;
  oauthClientSecret: string | null;
  oauthAuthorizationUrl: string | null;
  oauthTokenUrl: string | null;
  oauthScope: string | null;
  oauthRefreshToken: string | null;
  oauthTokenExpiresAt: Date | null;
};

async function fetchToolsFromServer(
  server: ServerConfig,
): Promise<MCPCachedTool[]> {
  let client: Awaited<ReturnType<typeof createMCPClient>> | null = null;

  const headers: Record<string, string> = { ...server.headers };
  if (!headers.Authorization && server.oauthAccessToken) {
    const oauthHeader = getOAuthAuthorizationHeader(server);
    if (oauthHeader) {
      headers.Authorization = oauthHeader;
    }
  }

  try {
    client = await withTimeout(
      createMCPClient({
        transport: {
          type: server.transportType,
          url: server.url,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        },
      }),
      MCP_CONNECTION_TIMEOUT_MS,
      "Connection timeout",
    );

    const tools = await withTimeout(
      client.tools(),
      MCP_CONNECTION_TIMEOUT_MS,
      "Timeout fetching tools",
    );

    return Object.entries(tools).map(([name, tool]) => {
      const toolAny = tool as Record<string, unknown>;
      const inputSchema = toolAny.inputSchema as
        | { jsonSchema?: Record<string, unknown> }
        | undefined;
      return {
        name,
        description: tool.description ?? "",
        inputSchema: inputSchema?.jsonSchema ?? {
          type: "object",
          properties: {},
        },
      };
    });
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }
}

const headersSchema = z.record(z.string(), z.string());

const mcpServerInput = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  transportType: z.enum(["http", "sse"]).default("http"),
  headers: headersSchema.optional(),
});

const listSelectFields = {
  id: mcpServer.id,
  name: mcpServer.name,
  url: mcpServer.url,
  transportType: mcpServer.transportType,
  headers: mcpServer.headers,
  enabled: mcpServer.enabled,
  oauthClientId: mcpServer.oauthClientId,
  oauthAccessToken: mcpServer.oauthAccessToken,
  oauthTokenExpiresAt: mcpServer.oauthTokenExpiresAt,
  createdAt: mcpServer.createdAt,
  updatedAt: mcpServer.updatedAt,
};

const authSelectFields = {
  id: mcpServer.id,
  name: mcpServer.name,
  url: mcpServer.url,
  transportType: mcpServer.transportType,
  headers: mcpServer.headers,
  toolsCache: mcpServer.toolsCache,
  oauthClientId: mcpServer.oauthClientId,
  oauthClientSecret: mcpServer.oauthClientSecret,
  oauthAuthorizationUrl: mcpServer.oauthAuthorizationUrl,
  oauthTokenUrl: mcpServer.oauthTokenUrl,
  oauthScope: mcpServer.oauthScope,
  oauthAccessToken: mcpServer.oauthAccessToken,
  oauthRefreshToken: mcpServer.oauthRefreshToken,
  oauthTokenExpiresAt: mcpServer.oauthTokenExpiresAt,
};

export const mcpRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const servers = await ctx.db
      .select(listSelectFields)
      .from(mcpServer)
      .where(eq(mcpServer.userId, ctx.session.user.id))
      .orderBy(desc(mcpServer.createdAt));

    return servers.map((server) => ({
      ...server,
      requiresOAuth: !!server.oauthClientId,
      oauthClientId: undefined,
      oauthAccessToken: server.oauthAccessToken ? "[connected]" : null,
    }));
  }),

  listEnabled: protectedProcedure.query(async ({ ctx }) => {
    const servers = await ctx.db
      .select(authSelectFields)
      .from(mcpServer)
      .where(
        and(
          eq(mcpServer.userId, ctx.session.user.id),
          eq(mcpServer.enabled, true),
        ),
      );

    return servers.filter((server) => {
      if (server.oauthClientId && !server.oauthAccessToken) {
        return false;
      }
      return true;
    });
  }),

  updateOAuthTokens: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        accessToken: z.string(),
        refreshToken: z.string().nullable(),
        expiresAt: z.date().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(mcpServer)
        .set({
          oauthAccessToken: input.accessToken,
          oauthRefreshToken: input.refreshToken,
          oauthTokenExpiresAt: input.expiresAt,
        })
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        );
    }),

  create: protectedProcedure
    .input(mcpServerInput)
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();

      await ctx.db.insert(mcpServer).values({
        id,
        userId: ctx.session.user.id,
        name: input.name,
        url: input.url,
        transportType: input.transportType as MCPTransportType,
        headers: input.headers,
      });

      const [created] = await ctx.db
        .select(listSelectFields)
        .from(mcpServer)
        .where(eq(mcpServer.id, id))
        .limit(1);

      return {
        ...created,
        oauthAccessToken: created.oauthAccessToken ? "[connected]" : null,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        url: z.string().url().optional(),
        transportType: z.enum(["http", "sse"]).optional(),
        headers: headersSchema.optional().nullable(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, enabled, ...rest } = input;

      const updateData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }

      if (enabled !== undefined) {
        updateData.enabled = enabled;
      }

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update",
        });
      }

      await ctx.db
        .update(mcpServer)
        .set(updateData)
        .where(
          and(eq(mcpServer.id, id), eq(mcpServer.userId, ctx.session.user.id)),
        );

      if (enabled === true) {
        const [server] = await ctx.db
          .select(authSelectFields)
          .from(mcpServer)
          .where(eq(mcpServer.id, id))
          .limit(1);

        if (server) {
          try {
            const tools = await fetchToolsFromServer(server);
            await ctx.db
              .update(mcpServer)
              .set({
                toolsCache: tools,
                toolsCacheUpdatedAt: new Date(),
              })
              .where(eq(mcpServer.id, id));
          } catch {}
        }
      }

      const [updated] = await ctx.db
        .select(listSelectFields)
        .from(mcpServer)
        .where(eq(mcpServer.id, id))
        .limit(1);

      return {
        ...updated,
        oauthAccessToken: updated.oauthAccessToken ? "[connected]" : null,
      };
    }),

  disconnectOAuth: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(mcpServer)
        .set({
          oauthAccessToken: null,
          oauthRefreshToken: null,
          oauthTokenExpiresAt: null,
        })
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(mcpServer)
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  refreshToolsCache: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [server] = await ctx.db
        .select(authSelectFields)
        .from(mcpServer)
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MCP server not found",
        });
      }

      try {
        const tools = await fetchToolsFromServer(server);
        await ctx.db
          .update(mcpServer)
          .set({
            toolsCache: tools,
            toolsCacheUpdatedAt: new Date(),
          })
          .where(eq(mcpServer.id, input.id));

        return { success: true, toolCount: tools.length };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch tools";
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to refresh tools cache: ${message}`,
        });
      }
    }),

  test: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        transportType: z.enum(["http", "sse"]),
        headers: headersSchema.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      let client: Awaited<ReturnType<typeof createMCPClient>> | null = null;

      try {
        client = await withTimeout(
          createMCPClient({
            transport: {
              type: input.transportType,
              url: input.url,
              headers: input.headers,
            },
          }),
          MCP_CONNECTION_TIMEOUT_MS,
          "Connection timeout",
        );

        const tools = await withTimeout(
          client.tools(),
          MCP_CONNECTION_TIMEOUT_MS,
          "Timeout fetching tools",
        );
        const toolList = Object.entries(tools).map(([name, tool]) => ({
          name,
          description: tool.description ?? "",
        }));

        return {
          success: true,
          tools: toolList,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Connection failed";
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to connect to MCP server: ${message}`,
        });
      } finally {
        if (client) {
          await client.close().catch(() => {});
        }
      }
    }),

  getTools: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [server] = await ctx.db
        .select(authSelectFields)
        .from(mcpServer)
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MCP server not found",
        });
      }

      let client: Awaited<ReturnType<typeof createMCPClient>> | null = null;

      const headers: Record<string, string> = { ...server.headers };
      if (!headers.Authorization) {
        const oauthHeader = getOAuthAuthorizationHeader(server);
        if (oauthHeader) {
          headers.Authorization = oauthHeader;
        }
      }

      try {
        client = await withTimeout(
          createMCPClient({
            transport: {
              type: server.transportType,
              url: server.url,
              headers: Object.keys(headers).length > 0 ? headers : undefined,
            },
          }),
          MCP_CONNECTION_TIMEOUT_MS,
          "Connection timeout",
        );

        const tools = await withTimeout(
          client.tools(),
          MCP_CONNECTION_TIMEOUT_MS,
          "Timeout fetching tools",
        );
        const toolList = Object.entries(tools).map(([name, tool]) => ({
          name,
          description: tool.description ?? "",
        }));

        return toolList;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Connection failed";
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to get tools: ${message}`,
        });
      } finally {
        if (client) {
          await client.close().catch(() => {});
        }
      }
    }),

  checkConnection: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [server] = await ctx.db
        .select(authSelectFields)
        .from(mcpServer)
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MCP server not found",
        });
      }

      const headers: Record<string, string> = { ...server.headers };
      if (!headers.Authorization) {
        const oauthHeader = getOAuthAuthorizationHeader(server);
        if (oauthHeader) {
          headers.Authorization = oauthHeader;
        }
      }

      let client: Awaited<ReturnType<typeof createMCPClient>> | null = null;

      try {
        client = await withTimeout(
          createMCPClient({
            transport: {
              type: server.transportType,
              url: server.url,
              headers: Object.keys(headers).length > 0 ? headers : undefined,
            },
          }),
          MCP_CONNECTION_TIMEOUT_MS,
          "Connection timeout",
        );

        const tools = await withTimeout(
          client.tools(),
          MCP_CONNECTION_TIMEOUT_MS,
          "Timeout fetching tools",
        );

        const toolsCache: MCPCachedTool[] = Object.entries(tools).map(
          ([name, tool]) => {
            const inputSchema = tool.inputSchema as
              | { jsonSchema?: Record<string, unknown> }
              | undefined;
            return {
              name,
              description: tool.description ?? "",
              inputSchema: inputSchema?.jsonSchema ?? {
                type: "object",
                properties: {},
              },
            };
          },
        );

        await ctx.db
          .update(mcpServer)
          .set({ toolsCache })
          .where(eq(mcpServer.id, input.id));

        return {
          connected: true,
          toolCount: toolsCache.length,
          tokenExpiresAt: server.oauthTokenExpiresAt,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Connection failed";
        return {
          connected: false,
          error: message,
          tokenExpiresAt: server.oauthTokenExpiresAt,
        };
      } finally {
        if (client) {
          await client.close().catch(() => {});
        }
      }
    }),

  getOAuthConfig: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [server] = await ctx.db
        .select({
          id: mcpServer.id,
          name: mcpServer.name,
          url: mcpServer.url,
          oauthClientId: mcpServer.oauthClientId,
          oauthClientSecret: mcpServer.oauthClientSecret,
          oauthAuthorizationUrl: mcpServer.oauthAuthorizationUrl,
          oauthTokenUrl: mcpServer.oauthTokenUrl,
          oauthScope: mcpServer.oauthScope,
        })
        .from(mcpServer)
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MCP server not found",
        });
      }

      return server;
    }),

  initiateOAuth: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        redirectUri: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [server] = await ctx.db
        .select({
          id: mcpServer.id,
          name: mcpServer.name,
          url: mcpServer.url,
          oauthClientId: mcpServer.oauthClientId,
          oauthClientSecret: mcpServer.oauthClientSecret,
          oauthAuthorizationUrl: mcpServer.oauthAuthorizationUrl,
          oauthTokenUrl: mcpServer.oauthTokenUrl,
          oauthScope: mcpServer.oauthScope,
        })
        .from(mcpServer)
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MCP server not found",
        });
      }

      let clientId = server.oauthClientId;
      let clientSecret = server.oauthClientSecret;
      let authorizationUrl = server.oauthAuthorizationUrl;
      let tokenUrl = server.oauthTokenUrl;
      let scope = server.oauthScope;

      if (!authorizationUrl || !tokenUrl) {
        const metadata = await discoverOAuthMetadata(server.url);

        if (!metadata) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Unable to discover OAuth configuration from MCP server. The server may not support OAuth.",
          });
        }

        authorizationUrl = metadata.authorization_endpoint;
        tokenUrl = metadata.token_endpoint;

        if (!scope && metadata.scopes_supported?.length) {
          scope = metadata.scopes_supported.join(" ");
        }

        if (metadata.registration_endpoint && !clientId) {
          try {
            const clientRegistration = await registerOAuthClient(
              metadata.registration_endpoint,
              input.redirectUri,
              `assistant-ui with ${server.name}`,
            );

            clientId = clientRegistration.client_id;
            clientSecret = clientRegistration.client_secret
              ? encrypt(clientRegistration.client_secret)
              : null;
          } catch {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Failed to register OAuth client with MCP server",
            });
          }
        }

        await ctx.db
          .update(mcpServer)
          .set({
            oauthClientId: clientId,
            oauthClientSecret: clientSecret,
            oauthAuthorizationUrl: authorizationUrl,
            oauthTokenUrl: tokenUrl,
            oauthScope: scope,
          })
          .where(eq(mcpServer.id, input.id));
      }

      if (!clientId || !authorizationUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "OAuth configuration is incomplete. Client ID and authorization URL are required.",
        });
      }

      return {
        clientId,
        authorizationUrl,
        tokenUrl,
        scope,
      };
    }),

  exchangeOAuthCode: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string(),
        redirectUri: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [server] = await ctx.db
        .select({
          id: mcpServer.id,
          url: mcpServer.url,
          transportType: mcpServer.transportType,
          headers: mcpServer.headers,
          oauthClientId: mcpServer.oauthClientId,
          oauthClientSecret: mcpServer.oauthClientSecret,
          oauthTokenUrl: mcpServer.oauthTokenUrl,
          oauthScope: mcpServer.oauthScope,
        })
        .from(mcpServer)
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MCP server not found",
        });
      }

      if (
        !server.oauthClientId ||
        !server.oauthClientSecret ||
        !server.oauthTokenUrl
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OAuth configuration is incomplete",
        });
      }

      const tokens = await exchangeCodeForTokens(
        {
          clientId: server.oauthClientId,
          clientSecret: decrypt(server.oauthClientSecret),
          authorizationUrl: "",
          tokenUrl: server.oauthTokenUrl,
          scope: server.oauthScope ?? undefined,
          redirectUri: input.redirectUri,
        },
        input.code,
      );

      const expiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : null;

      let toolsCache: MCPCachedTool[] | null = null;
      try {
        const headers: Record<string, string> = { ...server.headers };
        headers.Authorization = `Bearer ${tokens.accessToken}`;

        const client = await withTimeout(
          createMCPClient({
            transport: {
              type: server.transportType,
              url: server.url,
              headers,
            },
          }),
          MCP_CONNECTION_TIMEOUT_MS,
          "Connection timeout during OAuth exchange",
        );

        const tools = await withTimeout(
          client.tools(),
          MCP_CONNECTION_TIMEOUT_MS,
          "Timeout fetching tools during OAuth exchange",
        );

        toolsCache = Object.entries(tools).map(([name, tool]) => {
          const inputSchema = tool.inputSchema as
            | { jsonSchema?: Record<string, unknown> }
            | undefined;
          return {
            name,
            description: tool.description ?? "",
            inputSchema: inputSchema?.jsonSchema ?? {
              type: "object",
              properties: {},
            },
          };
        });

        await client.close().catch(() => {});
      } catch {}

      await ctx.db
        .update(mcpServer)
        .set({
          oauthAccessToken: encrypt(tokens.accessToken),
          oauthRefreshToken: tokens.refreshToken
            ? encrypt(tokens.refreshToken)
            : null,
          oauthTokenExpiresAt: expiresAt,
          enabled: true,
          toolsCache,
        })
        .where(
          and(
            eq(mcpServer.id, input.id),
            eq(mcpServer.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),
});
