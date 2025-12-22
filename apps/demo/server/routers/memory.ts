import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

import { memory } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

export const memoryRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memories = await ctx.db
      .select({
        id: memory.id,
        content: memory.content,
        category: memory.category,
        createdAt: memory.createdAt,
      })
      .from(memory)
      .where(eq(memory.userId, ctx.session.user.id))
      .orderBy(desc(memory.createdAt));

    return memories;
  }),

  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();

      await ctx.db.insert(memory).values({
        id,
        userId: ctx.session.user.id,
        content: input.content,
        category: input.category,
      });

      const [created] = await ctx.db
        .select({
          id: memory.id,
          content: memory.content,
          category: memory.category,
          createdAt: memory.createdAt,
        })
        .from(memory)
        .where(eq(memory.id, id))
        .limit(1);

      return created;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(memory).where(eq(memory.id, input.id));

      return { success: true };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(memory).where(eq(memory.userId, ctx.session.user.id));

    return { success: true };
  }),
});
