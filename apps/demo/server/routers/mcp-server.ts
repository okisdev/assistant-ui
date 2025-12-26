import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createMCPClient } from "@ai-sdk/mcp";
import { TRPCError } from "@trpc/server";

import { mcpServer, type MCPTransportType } from "@/lib/database/schema";
import {
  getOAuthAuthorizationHeader,
  discoverOAuthMetadata,
  registerOAuthClient,
  exchangeCodeForTokens,
} from "@/lib/mcp-auth";
import { encrypt, decrypt } from "@/lib/crypto";
import { protectedProcedure, createTRPCRouter } from "../trpc";

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
  oauthClientId: mcpServer.oauthClientId,
  oauthClientSecret: mcpServer.oauthClientSecret,
  oauthAuthorizationUrl: mcpServer.oauthAuthorizationUrl,
  oauthTokenUrl: mcpServer.oauthTokenUrl,
  oauthScope: mcpServer.oauthScope,
  oauthAccessToken: mcpServer.oauthAccessToken,
  oauthRefreshToken: mcpServer.oauthRefreshToken,
  oauthTokenExpiresAt: mcpServer.oauthTokenExpiresAt,
};

export const mcpServerRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const servers = await ctx.db
      .select(listSelectFields)
      .from(mcpServer)
      .where(eq(mcpServer.userId, ctx.session.user.id))
      .orderBy(desc(mcpServer.createdAt));

    return servers.map((server) => ({
      ...server,
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
      const { id, ...rest } = input;

      const updateData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
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
        client = await createMCPClient({
          transport: {
            type: input.transportType,
            url: input.url,
            headers: input.headers,
          },
        });

        const tools = await client.tools();
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
        client = await createMCPClient({
          transport: {
            type: server.transportType,
            url: server.url,
            headers: Object.keys(headers).length > 0 ? headers : undefined,
          },
        });

        const tools = await client.tools();
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
        client = await createMCPClient({
          transport: {
            type: server.transportType,
            url: server.url,
            headers: Object.keys(headers).length > 0 ? headers : undefined,
          },
        });

        const tools = await client.tools();
        const toolCount = Object.keys(tools).length;

        return {
          connected: true,
          toolCount,
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

      // Discover OAuth metadata if not already configured
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

        // Dynamic client registration if supported and no client ID exists
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
          } catch (error) {
            console.error("Failed to register OAuth client:", error);
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Failed to register OAuth client with MCP server",
            });
          }
        }

        // Save discovered OAuth configuration
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

      await ctx.db
        .update(mcpServer)
        .set({
          oauthAccessToken: encrypt(tokens.accessToken),
          oauthRefreshToken: tokens.refreshToken
            ? encrypt(tokens.refreshToken)
            : null,
          oauthTokenExpiresAt: expiresAt,
          enabled: true,
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
