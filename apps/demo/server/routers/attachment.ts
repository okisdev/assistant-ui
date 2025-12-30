import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { attachment, projectDocument, chat } from "@/lib/database/schema";
import type {
  AttachmentSource,
  GenerationMetadata,
} from "@/lib/database/types";
import { protectedProcedure, createTRPCRouter } from "../trpc";

const generationMetadataSchema = z.object({
  prompt: z.string(),
  model: z.string(),
  type: z.enum(["image", "code", "document", "audio", "video"]),
});

export const attachmentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chatId: z.string().nullable(),
        url: z.string(),
        pathname: z.string(),
        contentType: z.string(),
        size: z.number().nullable().optional(),
        source: z.enum(["upload", "generated"]).default("upload"),
        generationMetadata: generationMetadataSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(attachment).values({
        id: input.id,
        userId: ctx.session.user.id,
        chatId: input.chatId,
        url: input.url,
        pathname: input.pathname,
        contentType: input.contentType,
        size: input.size ?? null,
        source: input.source as AttachmentSource,
        generationMetadata: input.generationMetadata as
          | GenerationMetadata
          | undefined,
      });

      return { id: input.id };
    }),

  recent: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(10).default(3),
          source: z.enum(["upload", "generated"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 3;
      const source = input?.source;

      const conditions = [eq(attachment.userId, ctx.session.user.id)];
      if (source) {
        conditions.push(eq(attachment.source, source));
      }

      return ctx.db
        .select({
          id: attachment.id,
          url: attachment.url,
          pathname: attachment.pathname,
          contentType: attachment.contentType,
          size: attachment.size,
          source: attachment.source,
          generationMetadata: attachment.generationMetadata,
          createdAt: attachment.createdAt,
        })
        .from(attachment)
        .where(and(...conditions))
        .orderBy(desc(attachment.createdAt))
        .limit(limit);
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
          source: z.enum(["upload", "generated"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const source = input?.source;

      const conditions = [eq(attachment.userId, ctx.session.user.id)];
      if (source) {
        conditions.push(eq(attachment.source, source));
      }

      const attachments = await ctx.db
        .select({
          id: attachment.id,
          url: attachment.url,
          pathname: attachment.pathname,
          contentType: attachment.contentType,
          size: attachment.size,
          source: attachment.source,
          generationMetadata: attachment.generationMetadata,
          chatId: attachment.chatId,
          chatTitle: chat.title,
          createdAt: attachment.createdAt,
        })
        .from(attachment)
        .leftJoin(chat, eq(attachment.chatId, chat.id))
        .where(and(...conditions))
        .orderBy(desc(attachment.createdAt))
        .limit(limit + 1);

      let nextCursor: string | undefined;
      if (attachments.length > limit) {
        const nextItem = attachments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: attachments,
        nextCursor,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(attachment)
        .where(
          and(
            eq(attachment.id, input.id),
            eq(attachment.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  getStorageUsage: protectedProcedure.query(async ({ ctx }) => {
    // Get total attachment size
    const attachmentResult = await ctx.db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${attachment.size}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(attachment)
      .where(eq(attachment.userId, ctx.session.user.id));

    // Get total project document size
    const documentResult = await ctx.db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${projectDocument.size}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(projectDocument)
      .where(eq(projectDocument.userId, ctx.session.user.id));

    // Get recent attachments list
    const recentAttachments = await ctx.db
      .select({
        id: attachment.id,
        pathname: attachment.pathname,
        contentType: attachment.contentType,
        size: attachment.size,
        createdAt: attachment.createdAt,
      })
      .from(attachment)
      .where(eq(attachment.userId, ctx.session.user.id))
      .orderBy(desc(attachment.createdAt))
      .limit(10);

    const attachmentSize = Number(attachmentResult[0]?.totalSize ?? 0);
    const documentSize = Number(documentResult[0]?.totalSize ?? 0);
    const attachmentCount = Number(attachmentResult[0]?.count ?? 0);
    const documentCount = Number(documentResult[0]?.count ?? 0);

    return {
      usedBytes: attachmentSize + documentSize,
      limitBytes: 100 * 1024 * 1024, // 100MB
      attachmentCount,
      documentCount,
      recentAttachments,
    };
  }),
});
