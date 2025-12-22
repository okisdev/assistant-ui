import { z } from "zod";
import { eq, desc, and, isNull } from "drizzle-orm";

import { chat, chatMessage, chatVote, share } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../../trpc";
import { voteRouter } from "./vote";

export const chatRouter = createTRPCRouter({
  vote: voteRouter,

  list: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().nullable().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const projectId = input?.projectId;

      // Build the where condition
      const conditions = [eq(chat.userId, ctx.session.user.id)];

      if (projectId === null) {
        // Explicitly filter for chats with no project
        conditions.push(isNull(chat.projectId));
      } else if (projectId !== undefined) {
        // Filter for specific project
        conditions.push(eq(chat.projectId, projectId));
      }
      // If projectId is undefined, return all chats (no project filter)

      const chats = await ctx.db
        .select({
          id: chat.id,
          projectId: chat.projectId,
          remoteId: chat.remoteId,
          title: chat.title,
          status: chat.status,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        })
        .from(chat)
        .where(and(...conditions))
        .orderBy(desc(chat.updatedAt));

      return chats;
    }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        projectId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(chat).values({
        id: input.id,
        userId: ctx.session.user.id,
        projectId: input.projectId ?? null,
      });

      return { id: input.id, projectId: input.projectId ?? null };
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
        .delete(share)
        .where(
          and(
            eq(share.resourceType, "chat"),
            eq(share.resourceId, input.id),
            eq(share.userId, ctx.session.user.id),
          ),
        );

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
          projectId: chat.projectId,
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

  createMessage: protectedProcedure
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
});
