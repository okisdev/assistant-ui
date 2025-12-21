import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { chat, chatVote } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../../trpc";

export const voteRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        messageId: z.string(),
        type: z.enum(["positive", "negative"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this chat
      const chatResult = await ctx.db
        .select({ id: chat.id })
        .from(chat)
        .where(
          and(eq(chat.id, input.chatId), eq(chat.userId, ctx.session.user.id)),
        )
        .limit(1);

      if (!chatResult[0]) {
        throw new Error("Chat not found");
      }

      // Upsert the vote
      await ctx.db
        .insert(chatVote)
        .values({
          chatId: input.chatId,
          messageId: input.messageId,
          userId: ctx.session.user.id,
          type: input.type,
        })
        .onConflictDoUpdate({
          target: [chatVote.chatId, chatVote.messageId, chatVote.userId],
          set: { type: input.type },
        });

      return { success: true };
    }),
});
