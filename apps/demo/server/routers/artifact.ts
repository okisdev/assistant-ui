import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { artifact, artifactVersion, chat } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

export const artifactRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chatId: z.string(),
        title: z.string(),
        content: z.string(),
        type: z.enum(["html", "react", "svg"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: artifact.id,
          versionCount: artifact.versionCount,
        })
        .from(artifact)
        .where(
          and(
            eq(artifact.chatId, input.chatId),
            eq(artifact.title, input.title),
            eq(artifact.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (existing) {
        // Create new version
        const newVersion = existing.versionCount + 1;
        await ctx.db.insert(artifactVersion).values({
          id: nanoid(),
          artifactId: existing.id,
          version: newVersion,
          content: input.content,
          type: input.type,
        });

        // Update artifact version count
        await ctx.db
          .update(artifact)
          .set({
            versionCount: newVersion,
          })
          .where(eq(artifact.id, existing.id));

        return { id: existing.id, version: newVersion, updated: true };
      }

      // Create new artifact
      await ctx.db.insert(artifact).values({
        id: input.id,
        userId: ctx.session.user.id,
        chatId: input.chatId,
        title: input.title,
        versionCount: 1,
      });

      // Create first version
      await ctx.db.insert(artifactVersion).values({
        id: nanoid(),
        artifactId: input.id,
        version: 1,
        content: input.content,
        type: input.type,
      });

      return { id: input.id, version: 1, updated: false };
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;

      const artifacts = await ctx.db
        .select({
          id: artifact.id,
          title: artifact.title,
          versionCount: artifact.versionCount,
          chatId: artifact.chatId,
          chatTitle: chat.title,
          createdAt: artifact.createdAt,
          updatedAt: artifact.updatedAt,
        })
        .from(artifact)
        .innerJoin(chat, eq(artifact.chatId, chat.id))
        .where(eq(artifact.userId, ctx.session.user.id))
        .orderBy(desc(artifact.updatedAt))
        .limit(limit + 1);

      let nextCursor: string | undefined;
      if (artifacts.length > limit) {
        const nextItem = artifacts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: artifacts,
        nextCursor,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get artifact metadata
      const [artifactData] = await ctx.db
        .select({
          id: artifact.id,
          title: artifact.title,
          versionCount: artifact.versionCount,
          chatId: artifact.chatId,
          createdAt: artifact.createdAt,
          updatedAt: artifact.updatedAt,
        })
        .from(artifact)
        .where(
          and(
            eq(artifact.id, input.id),
            eq(artifact.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!artifactData) return null;

      // Get latest version content
      const [latestVersion] = await ctx.db
        .select({
          content: artifactVersion.content,
          type: artifactVersion.type,
          version: artifactVersion.version,
        })
        .from(artifactVersion)
        .where(eq(artifactVersion.artifactId, artifactData.id))
        .orderBy(desc(artifactVersion.version))
        .limit(1);

      return {
        ...artifactData,
        content: latestVersion?.content ?? "",
        type: latestVersion?.type ?? "html",
        currentVersion: latestVersion?.version ?? 1,
      };
    }),

  getVersion: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        version: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify user owns the artifact
      const [artifactData] = await ctx.db
        .select({
          id: artifact.id,
          title: artifact.title,
          versionCount: artifact.versionCount,
          chatId: artifact.chatId,
        })
        .from(artifact)
        .where(
          and(
            eq(artifact.id, input.id),
            eq(artifact.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!artifactData) return null;

      // Get specific version
      const [versionData] = await ctx.db
        .select({
          id: artifactVersion.id,
          content: artifactVersion.content,
          type: artifactVersion.type,
          version: artifactVersion.version,
          createdAt: artifactVersion.createdAt,
        })
        .from(artifactVersion)
        .where(
          and(
            eq(artifactVersion.artifactId, input.id),
            eq(artifactVersion.version, input.version),
          ),
        )
        .limit(1);

      if (!versionData) return null;

      return {
        ...artifactData,
        ...versionData,
      };
    }),

  listVersions: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the artifact
      const [artifactData] = await ctx.db
        .select({ id: artifact.id })
        .from(artifact)
        .where(
          and(
            eq(artifact.id, input.id),
            eq(artifact.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!artifactData) return [];

      // Get all versions
      const versions = await ctx.db
        .select({
          id: artifactVersion.id,
          version: artifactVersion.version,
          type: artifactVersion.type,
          createdAt: artifactVersion.createdAt,
        })
        .from(artifactVersion)
        .where(eq(artifactVersion.artifactId, input.id))
        .orderBy(desc(artifactVersion.version));

      return versions;
    }),
});
