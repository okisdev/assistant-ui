import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { attachment, projectDocument } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

export const attachmentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chatId: z.string().nullable(),
        url: z.string(),
        pathname: z.string(),
        contentType: z.string(),
        size: z.number(),
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
        size: input.size,
      });

      return { id: input.id };
    }),

  recent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(3) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 3;
      return ctx.db
        .select({
          id: attachment.id,
          url: attachment.url,
          pathname: attachment.pathname,
          contentType: attachment.contentType,
          size: attachment.size,
          createdAt: attachment.createdAt,
        })
        .from(attachment)
        .where(eq(attachment.userId, ctx.session.user.id))
        .orderBy(desc(attachment.createdAt))
        .limit(limit);
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
