import { z } from "zod";
import { attachment } from "@/lib/database/schema";
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
});
