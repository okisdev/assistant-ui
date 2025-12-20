import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";

import { chat, message } from "@/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

export const chatRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const chats = await ctx.db
      .select({
        id: chat.id,
        remoteId: chat.remoteId,
        title: chat.title,
        status: chat.status,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })
      .from(chat)
      .where(eq(chat.userId, ctx.session.user.id))
      .orderBy(desc(chat.updatedAt));

    return chats;
  }),

  create: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(chat).values({
        id: input.id,
        userId: ctx.session.user.id,
      });

      return { id: input.id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        status: z.enum(["regular", "archived"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      await ctx.db
        .update(chat)
        .set(updates)
        .where(and(eq(chat.id, id), eq(chat.userId, ctx.session.user.id)));

      return { success: true };
    }),

  updateRemoteId: protectedProcedure
    .input(z.object({ id: z.string(), remoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(chat)
        .set({ remoteId: input.remoteId })
        .where(
          and(eq(chat.id, input.id), eq(chat.userId, ctx.session.user.id)),
        );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(chat)
        .where(
          and(eq(chat.id, input.id), eq(chat.userId, ctx.session.user.id)),
        );

      return { success: true };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: chat.id,
          remoteId: chat.remoteId,
          title: chat.title,
          status: chat.status,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        })
        .from(chat)
        .where(and(eq(chat.id, input.id), eq(chat.userId, ctx.session.user.id)))
        .limit(1);

      return result[0] ?? null;
    }),

  getMessages: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ ctx, input }) => {
      // First verify the user owns this chat
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

      const messages = await ctx.db
        .select({
          id: message.id,
          chatId: message.chatId,
          parentId: message.parentId,
          role: message.role,
          content: message.content,
          status: message.status,
          metadata: message.metadata,
          createdAt: message.createdAt,
        })
        .from(message)
        .where(eq(message.chatId, input.chatId))
        .orderBy(message.createdAt);

      return messages;
    }),

  createMessage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chatId: z.string(),
        parentId: z.string().nullable(),
        role: z.string(),
        content: z.unknown(),
        status: z.unknown().optional(),
        metadata: z.unknown().optional(),
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

      await ctx.db.insert(message).values({
        id: input.id,
        chatId: input.chatId,
        parentId: input.parentId,
        role: input.role,
        content: input.content,
        status: input.status,
        metadata: input.metadata,
      });

      return { id: input.id };
    }),
});
