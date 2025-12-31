import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { chat, chatMessage, chatVote } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../../trpc";

export const messageRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      const chatResult = await ctx.db
        .select({ id: chat.id })
        .from(chat)
        .where(
          and(eq(chat.id, input.chatId), eq(chat.userId, ctx.session.user.id)),
        )
        .limit(1);

      if (!chatResult[0]) {
        return [];
      }

      const [messages, votes] = await Promise.all([
        ctx.db
          .select({
            id: chatMessage.id,
            chatId: chatMessage.chatId,
            parentId: chatMessage.parentId,
            role: chatMessage.role,
            format: chatMessage.format,
            content: chatMessage.content,
            status: chatMessage.status,
            metadata: chatMessage.metadata,
            createdAt: chatMessage.createdAt,
          })
          .from(chatMessage)
          .where(eq(chatMessage.chatId, input.chatId))
          .orderBy(chatMessage.createdAt),
        ctx.db
          .select({
            messageId: chatVote.messageId,
            type: chatVote.type,
          })
          .from(chatVote)
          .where(
            and(
              eq(chatVote.chatId, input.chatId),
              eq(chatVote.userId, ctx.session.user.id),
            ),
          ),
      ]);

      const voteMap = Object.fromEntries(
        votes.map((v) => [v.messageId, v.type]),
      );

      return messages.map((m) => {
        const voteType = voteMap[m.id];
        if (!voteType) return m;

        const metadata = m.metadata as Record<string, unknown> | null;
        return {
          ...m,
          metadata: { ...metadata, submittedFeedback: { type: voteType } },
        };
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chatId: z.string(),
        parentId: z.string().nullable(),
        role: z.string().optional(),
        format: z.string().optional(),
        content: z.unknown(),
        status: z.unknown().optional(),
        metadata: z.unknown().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

      await ctx.db.insert(chatMessage).values({
        id: input.id,
        chatId: input.chatId,
        parentId: input.parentId,
        role: input.role,
        format: input.format ?? "aui/v0",
        content: input.content,
        status: input.status,
        metadata: input.metadata,
      });

      return { id: input.id };
    }),

  save: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        messages: z.array(
          z.object({
            id: z.string(),
            parentId: z.string().nullable().optional(),
            role: z.string(),
            parts: z.unknown(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const chatResult = await ctx.db
        .select({ id: chat.id })
        .from(chat)
        .where(
          and(eq(chat.id, input.chatId), eq(chat.userId, ctx.session.user.id)),
        )
        .limit(1);

      if (!chatResult[0] || input.messages.length === 0) {
        return { saved: 0 };
      }

      const existingMessages = await ctx.db
        .select({ id: chatMessage.id })
        .from(chatMessage)
        .where(eq(chatMessage.chatId, input.chatId));

      const existingIds = new Set(existingMessages.map((m) => m.id));

      const newMessages = input.messages.filter((m) => !existingIds.has(m.id));

      if (newMessages.length === 0) {
        return { saved: 0 };
      }

      const messagesToInsert = newMessages.map((msg) => {
        let parentId = msg.parentId;
        if (parentId === undefined) {
          const inputIdx = input.messages.findIndex((m) => m.id === msg.id);
          parentId = inputIdx > 0 ? input.messages[inputIdx - 1]!.id : null;
        }

        return {
          id: msg.id,
          chatId: input.chatId,
          parentId,
          role: msg.role,
          format: "ai-sdk/v5",
          content: {
            role: msg.role,
            parts: msg.parts,
          },
          status: undefined,
          metadata: undefined,
        };
      });

      await ctx.db
        .insert(chatMessage)
        .values(messagesToInsert)
        .onConflictDoNothing({ target: chatMessage.id });

      return { saved: newMessages.length };
    }),
});
