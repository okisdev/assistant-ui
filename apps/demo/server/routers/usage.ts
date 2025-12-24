import { z } from "zod";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

import { usage } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

const timeRangeSchema = z
  .enum(["today", "week", "month", "all"])
  .default("all");

function getDateRange(timeRange: z.infer<typeof timeRangeSchema>): {
  start: Date | null;
  end: Date;
} {
  const now = new Date();
  const end = now;

  switch (timeRange) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "month": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    default:
      return { start: null, end };
  }
}

export const usageRouter = createTRPCRouter({
  getStats: protectedProcedure
    .input(z.object({ timeRange: timeRangeSchema }).optional())
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input?.timeRange ?? "all");

      const conditions = [eq(usage.userId, ctx.session.user.id)];
      if (start) {
        conditions.push(gte(usage.createdAt, start));
      }
      conditions.push(lte(usage.createdAt, end));

      const result = await ctx.db
        .select({
          totalInputTokens: sql<number>`COALESCE(SUM(${usage.inputTokens}), 0)`,
          totalOutputTokens: sql<number>`COALESCE(SUM(${usage.outputTokens}), 0)`,
          totalReasoningTokens: sql<number>`COALESCE(SUM(${usage.reasoningTokens}), 0)`,
          totalTokens: sql<number>`COALESCE(SUM(${usage.totalTokens}), 0)`,
          totalCost: sql<number>`COALESCE(SUM(${usage.estimatedCost}), 0)`,
          requestCount: sql<number>`COUNT(*)`,
        })
        .from(usage)
        .where(and(...conditions));

      const stats = result[0];
      return {
        inputTokens: Number(stats?.totalInputTokens ?? 0),
        outputTokens: Number(stats?.totalOutputTokens ?? 0),
        reasoningTokens: Number(stats?.totalReasoningTokens ?? 0),
        totalTokens: Number(stats?.totalTokens ?? 0),
        estimatedCost: Number(stats?.totalCost ?? 0),
        requestCount: Number(stats?.requestCount ?? 0),
      };
    }),

  getByModel: protectedProcedure
    .input(z.object({ timeRange: timeRangeSchema }).optional())
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input?.timeRange ?? "all");

      const conditions = [eq(usage.userId, ctx.session.user.id)];
      if (start) {
        conditions.push(gte(usage.createdAt, start));
      }
      conditions.push(lte(usage.createdAt, end));

      const results = await ctx.db
        .select({
          modelId: usage.modelId,
          totalTokens: sql<number>`COALESCE(SUM(${usage.totalTokens}), 0)`,
          totalCost: sql<number>`COALESCE(SUM(${usage.estimatedCost}), 0)`,
          requestCount: sql<number>`COUNT(*)`,
        })
        .from(usage)
        .where(and(...conditions))
        .groupBy(usage.modelId)
        .orderBy(sql`SUM(${usage.totalTokens}) DESC`);

      return results.map((r) => ({
        modelId: r.modelId,
        totalTokens: Number(r.totalTokens),
        estimatedCost: Number(r.totalCost),
        requestCount: Number(r.requestCount),
      }));
    }),

  getByDay: protectedProcedure
    .input(z.object({ timeRange: timeRangeSchema }).optional())
    .query(async ({ ctx, input }) => {
      const { start, end } = getDateRange(input?.timeRange ?? "month");

      const conditions = [eq(usage.userId, ctx.session.user.id)];
      if (start) {
        conditions.push(gte(usage.createdAt, start));
      }
      conditions.push(lte(usage.createdAt, end));

      const results = await ctx.db
        .select({
          date: sql<string>`DATE(${usage.createdAt})`,
          totalTokens: sql<number>`COALESCE(SUM(${usage.totalTokens}), 0)`,
          totalCost: sql<number>`COALESCE(SUM(${usage.estimatedCost}), 0)`,
          requestCount: sql<number>`COUNT(*)`,
        })
        .from(usage)
        .where(and(...conditions))
        .groupBy(sql`DATE(${usage.createdAt})`)
        .orderBy(sql`DATE(${usage.createdAt})`);

      return results.map((r) => ({
        date: r.date,
        totalTokens: Number(r.totalTokens),
        estimatedCost: Number(r.totalCost),
        requestCount: Number(r.requestCount),
      }));
    }),

  getHeatmap: protectedProcedure.query(async ({ ctx }) => {
    const start = new Date();
    start.setDate(start.getDate() - 365);
    start.setHours(0, 0, 0, 0);

    const results = await ctx.db
      .select({
        date: sql<string>`DATE(${usage.createdAt})`,
        totalTokens: sql<number>`COALESCE(SUM(${usage.totalTokens}), 0)`,
        requestCount: sql<number>`COUNT(*)`,
      })
      .from(usage)
      .where(
        and(eq(usage.userId, ctx.session.user.id), gte(usage.createdAt, start)),
      )
      .groupBy(sql`DATE(${usage.createdAt})`);

    return results.map((r) => ({
      date: r.date,
      totalTokens: Number(r.totalTokens),
      requestCount: Number(r.requestCount),
    }));
  }),

  getRecent: protectedProcedure
    .input(
      z.object({ limit: z.number().min(1).max(100).default(10) }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;

      const results = await ctx.db
        .select({
          id: usage.id,
          chatId: usage.chatId,
          messageId: usage.messageId,
          modelId: usage.modelId,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          reasoningTokens: usage.reasoningTokens,
          totalTokens: usage.totalTokens,
          estimatedCost: usage.estimatedCost,
          createdAt: usage.createdAt,
        })
        .from(usage)
        .where(eq(usage.userId, ctx.session.user.id))
        .orderBy(desc(usage.createdAt))
        .limit(limit);

      return results;
    }),
});
