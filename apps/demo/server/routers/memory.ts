import { z } from "zod";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { memory } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

export const memoryRouter = createTRPCRouter({
  // List memories
  // - projectId is undefined/null -> only return global memories (projectId IS NULL)
  // - projectId has value -> return global memories + project-specific memories
  list: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const projectId = input?.projectId;

      const whereCondition = projectId
        ? and(
            eq(memory.userId, ctx.session.user.id),
            or(isNull(memory.projectId), eq(memory.projectId, projectId)),
          )
        : and(eq(memory.userId, ctx.session.user.id), isNull(memory.projectId));

      const memories = await ctx.db
        .select({
          id: memory.id,
          content: memory.content,
          category: memory.category,
          projectId: memory.projectId,
          createdAt: memory.createdAt,
        })
        .from(memory)
        .where(whereCondition)
        .orderBy(desc(memory.createdAt));

      return memories;
    }),

  // Create a memory
  // - projectId is undefined -> create global memory
  // - projectId has value -> create project-specific memory
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        category: z.string().optional(),
        projectId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();

      await ctx.db.insert(memory).values({
        id,
        userId: ctx.session.user.id,
        projectId: input.projectId,
        content: input.content,
        category: input.category,
      });

      const [created] = await ctx.db
        .select({
          id: memory.id,
          content: memory.content,
          category: memory.category,
          projectId: memory.projectId,
          createdAt: memory.createdAt,
        })
        .from(memory)
        .where(eq(memory.id, id))
        .limit(1);

      return created;
    }),

  // Delete a specific memory
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(memory)
        .where(
          and(eq(memory.id, input.id), eq(memory.userId, ctx.session.user.id)),
        );

      return { success: true };
    }),

  // Clear memories
  // - projectId is undefined -> clear only global memories
  // - projectId has value -> clear only that project's memories
  clear: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const projectId = input?.projectId;

      const whereCondition = projectId
        ? and(
            eq(memory.userId, ctx.session.user.id),
            eq(memory.projectId, projectId),
          )
        : and(eq(memory.userId, ctx.session.user.id), isNull(memory.projectId));

      await ctx.db.delete(memory).where(whereCondition);

      return { success: true };
    }),
});
