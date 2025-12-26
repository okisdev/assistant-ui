import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

import {
  application,
  userApplication,
  account,
  type ApplicationStatus,
} from "@/lib/database/schema";
import {
  BUILTIN_APPS,
  getBuiltinApp,
  getBuiltinAppById,
  type AppConnectionConfig,
} from "@/lib/integrations/apps";
import { protectedProcedure, publicProcedure, createTRPCRouter } from "../trpc";

type AppOutput = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  category: string;
  status: ApplicationStatus;
  verified: boolean;
  publisher: string | null;
  websiteUrl: string | null;
  privacyPolicyUrl: string | null;
  termsOfServiceUrl: string | null;
  connection: AppConnectionConfig;
  isBuiltin: boolean;
};

function builtinToAppOutput(app: (typeof BUILTIN_APPS)[number]): AppOutput {
  return {
    id: app.id,
    slug: app.slug,
    name: app.name,
    description: app.description,
    iconUrl: app.iconUrl,
    category: app.category,
    status: app.status,
    verified: app.verified,
    publisher: app.publisher,
    websiteUrl: app.websiteUrl,
    privacyPolicyUrl: app.privacyPolicyUrl,
    termsOfServiceUrl: app.termsOfServiceUrl,
    connection: app.connection,
    isBuiltin: true,
  };
}

export const applicationRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const builtinApps = BUILTIN_APPS.map(builtinToAppOutput);

    const customApps = await ctx.db
      .select()
      .from(application)
      .where(eq(application.isBuiltin, false))
      .orderBy(application.name);

    const customAppsOutput: AppOutput[] = customApps.map((app) => ({
      id: app.id,
      slug: app.slug,
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      category: app.category,
      status: app.status,
      verified: app.verified,
      publisher: app.publisher,
      websiteUrl: app.websiteUrl,
      privacyPolicyUrl: app.privacyPolicyUrl,
      termsOfServiceUrl: app.termsOfServiceUrl,
      connection: {
        type: "oauth" as const,
        provider: app.oauthProvider,
        authorizationUrl: "",
        tokenUrl: "",
        scopes: app.oauthScopes,
      },
      isBuiltin: false,
    }));

    return [...builtinApps, ...customAppsOutput].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const builtinApp = getBuiltinApp(input.slug);
      if (builtinApp) {
        return builtinToAppOutput(builtinApp);
      }

      const [customApp] = await ctx.db
        .select()
        .from(application)
        .where(
          and(
            eq(application.slug, input.slug),
            eq(application.isBuiltin, false),
          ),
        )
        .limit(1);

      if (!customApp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      return {
        id: customApp.id,
        slug: customApp.slug,
        name: customApp.name,
        description: customApp.description,
        iconUrl: customApp.iconUrl,
        category: customApp.category,
        status: customApp.status,
        verified: customApp.verified,
        publisher: customApp.publisher,
        websiteUrl: customApp.websiteUrl,
        privacyPolicyUrl: customApp.privacyPolicyUrl,
        termsOfServiceUrl: customApp.termsOfServiceUrl,
        connection: {
          type: "oauth" as const,
          provider: customApp.oauthProvider,
          authorizationUrl: "",
          tokenUrl: "",
          scopes: customApp.oauthScopes,
        },
        isBuiltin: false,
      } satisfies AppOutput;
    }),

  userConnections: protectedProcedure.query(async ({ ctx }) => {
    const connections = await ctx.db
      .select()
      .from(userApplication)
      .leftJoin(account, eq(userApplication.accountId, account.id))
      .where(eq(userApplication.userId, ctx.session.user.id))
      .orderBy(desc(userApplication.connectedAt));

    return connections
      .map((conn) => {
        const builtinApp = getBuiltinAppById(
          conn.user_application.applicationId,
        );

        if (builtinApp) {
          const isScopeConnection = builtinApp.connection.type === "scope";
          const isConnected = isScopeConnection
            ? !!conn.account
            : !!conn.user_application.accessToken;

          return {
            id: conn.user_application.id,
            applicationId: conn.user_application.applicationId,
            enabled: conn.user_application.enabled,
            config: conn.user_application.config,
            connectedAt: conn.user_application.connectedAt,
            isConnected,
            externalName: conn.user_application.externalName,
            application: {
              id: builtinApp.id,
              slug: builtinApp.slug,
              name: builtinApp.name,
              description: builtinApp.description,
              iconUrl: builtinApp.iconUrl,
              category: builtinApp.category,
              connection: builtinApp.connection,
            },
          };
        }

        return null;
      })
      .filter((conn): conn is NonNullable<typeof conn> => conn !== null);
  }),

  getConnectionStatus: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const builtinApp = getBuiltinAppById(input.applicationId);

      const [connection] = await ctx.db
        .select({
          id: userApplication.id,
          enabled: userApplication.enabled,
          accountId: userApplication.accountId,
          accessToken: userApplication.accessToken,
          externalName: userApplication.externalName,
          connectedAt: userApplication.connectedAt,
        })
        .from(userApplication)
        .where(
          and(
            eq(userApplication.userId, ctx.session.user.id),
            eq(userApplication.applicationId, input.applicationId),
          ),
        )
        .limit(1);

      if (!connection) {
        return { connected: false, enabled: false };
      }

      let isConnected = false;
      if (builtinApp?.connection.type === "scope") {
        isConnected = connection.accountId !== null;
      } else {
        isConnected = connection.accessToken !== null;
      }

      return {
        connected: isConnected,
        enabled: connection.enabled,
        externalName: connection.externalName,
        connectedAt: connection.connectedAt,
      };
    }),

  connect: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        accountId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const builtinApp = getBuiltinAppById(input.applicationId);
      if (!builtinApp) {
        const [customApp] = await ctx.db
          .select({ id: application.id })
          .from(application)
          .where(eq(application.id, input.applicationId))
          .limit(1);

        if (!customApp) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }
      }

      const [existing] = await ctx.db
        .select()
        .from(userApplication)
        .where(
          and(
            eq(userApplication.userId, ctx.session.user.id),
            eq(userApplication.applicationId, input.applicationId),
          ),
        )
        .limit(1);

      if (existing) {
        await ctx.db
          .update(userApplication)
          .set({
            accountId: input.accountId,
            enabled: true,
          })
          .where(eq(userApplication.id, existing.id));

        return { id: existing.id, updated: true };
      }

      const id = nanoid();
      await ctx.db.insert(userApplication).values({
        id,
        userId: ctx.session.user.id,
        applicationId: input.applicationId,
        accountId: input.accountId,
        enabled: true,
      });

      return { id, updated: false };
    }),

  disconnect: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userApplication)
        .where(
          and(
            eq(userApplication.userId, ctx.session.user.id),
            eq(userApplication.applicationId, input.applicationId),
          ),
        );

      return { success: true };
    }),

  toggleEnabled: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(userApplication)
        .set({ enabled: input.enabled })
        .where(
          and(
            eq(userApplication.userId, ctx.session.user.id),
            eq(userApplication.applicationId, input.applicationId),
          ),
        );

      return { success: true };
    }),

  linkAccount: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [userApp] = await ctx.db
        .select()
        .from(userApplication)
        .where(
          and(
            eq(userApplication.userId, ctx.session.user.id),
            eq(userApplication.applicationId, input.applicationId),
          ),
        )
        .limit(1);

      if (!userApp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application connection not found",
        });
      }

      await ctx.db
        .update(userApplication)
        .set({ accountId: input.accountId })
        .where(eq(userApplication.id, userApp.id));

      return { success: true };
    }),

  linkScopeAccount: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        provider: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [providerAccount] = await ctx.db
        .select()
        .from(account)
        .where(
          and(
            eq(account.userId, ctx.session.user.id),
            eq(account.providerId, input.provider),
          ),
        )
        .orderBy(desc(account.updatedAt))
        .limit(1);

      if (!providerAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No ${input.provider} account found. Please sign in with ${input.provider} first.`,
        });
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (providerAccount.updatedAt < fiveMinutesAgo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OAuth session expired. Please try connecting again.",
        });
      }

      const [existing] = await ctx.db
        .select()
        .from(userApplication)
        .where(
          and(
            eq(userApplication.userId, ctx.session.user.id),
            eq(userApplication.applicationId, input.applicationId),
          ),
        )
        .limit(1);

      if (existing) {
        await ctx.db
          .update(userApplication)
          .set({
            accountId: providerAccount.id,
            enabled: true,
            updatedAt: new Date(),
          })
          .where(eq(userApplication.id, existing.id));

        return { id: existing.id, updated: true };
      }

      const id = nanoid();
      await ctx.db.insert(userApplication).values({
        id,
        userId: ctx.session.user.id,
        applicationId: input.applicationId,
        accountId: providerAccount.id,
        enabled: true,
        connectedAt: new Date(),
        updatedAt: new Date(),
      });

      return { id, updated: false };
    }),

  saveOAuthConnection: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        accessToken: z.string(),
        refreshToken: z.string().nullable(),
        tokenExpiresAt: z.date().nullable(),
        externalId: z.string().nullable(),
        externalName: z.string().nullable(),
        oauthMetadata: z.record(z.string(), z.unknown()).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(userApplication)
        .where(
          and(
            eq(userApplication.userId, ctx.session.user.id),
            eq(userApplication.applicationId, input.applicationId),
          ),
        )
        .limit(1);

      if (existing) {
        await ctx.db
          .update(userApplication)
          .set({
            accessToken: input.accessToken,
            refreshToken: input.refreshToken,
            tokenExpiresAt: input.tokenExpiresAt,
            externalId: input.externalId,
            externalName: input.externalName,
            oauthMetadata: input.oauthMetadata,
            enabled: true,
            updatedAt: new Date(),
          })
          .where(eq(userApplication.id, existing.id));

        return { id: existing.id, updated: true };
      }

      const id = nanoid();
      await ctx.db.insert(userApplication).values({
        id,
        userId: ctx.session.user.id,
        applicationId: input.applicationId,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiresAt: input.tokenExpiresAt,
        externalId: input.externalId,
        externalName: input.externalName,
        oauthMetadata: input.oauthMetadata,
        enabled: true,
        connectedAt: new Date(),
        updatedAt: new Date(),
      });

      return { id, updated: false };
    }),
});
