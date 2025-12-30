import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { generatedImage, chat } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

export const generatedImageRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chatId: z.string().nullable(),
        url: z.string(),
        pathname: z.string(),
        prompt: z.string(),
        model: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(generatedImage).values({
        id: input.id,
        userId: ctx.session.user.id,
        chatId: input.chatId,
        url: input.url,
        pathname: input.pathname,
        prompt: input.prompt,
        model: input.model,
      });

      return { id: input.id };
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

      const images = await ctx.db
        .select({
          id: generatedImage.id,
          url: generatedImage.url,
          pathname: generatedImage.pathname,
          prompt: generatedImage.prompt,
          model: generatedImage.model,
          chatId: generatedImage.chatId,
          chatTitle: chat.title,
          createdAt: generatedImage.createdAt,
        })
        .from(generatedImage)
        .leftJoin(chat, eq(generatedImage.chatId, chat.id))
        .where(eq(generatedImage.userId, ctx.session.user.id))
        .orderBy(desc(generatedImage.createdAt))
        .limit(limit + 1);

      let nextCursor: string | undefined;
      if (images.length > limit) {
        const nextItem = images.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: images,
        nextCursor,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(generatedImage)
        .where(
          and(
            eq(generatedImage.id, input.id),
            eq(generatedImage.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),
});
