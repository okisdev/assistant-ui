import { z } from "zod";
import { eq, desc, and, isNull, isNotNull, inArray, sql } from "drizzle-orm";

import {
  chat,
  chatMessage,
  chatVote,
  share,
  project,
} from "@/lib/database/schema";
import {
  AVAILABLE_MODELS,
  isDeprecatedModel,
  type ModelId,
} from "@/lib/ai/models";
import { protectedProcedure, createTRPCRouter } from "../../trpc";
import { voteRouter } from "./vote";

const modelIdSchema = z.enum(
  AVAILABLE_MODELS.map((m) => m.id) as [ModelId, ...ModelId[]],
);

const activeModelIdSchema = modelIdSchema.refine(
  (id) => !isDeprecatedModel(id),
  { message: "Deprecated models cannot be selected" },
);

async function verifyProjectOwnership(
  db: typeof import("@/lib/database").database,
  projectId: string | null | undefined,
  userId: string,
): Promise<void> {
  if (!projectId) return;

  const projectResult = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
    .limit(1);

  if (!projectResult[0]) {
    throw new Error("Project not found or access denied");
  }
}

export const chatRouter = createTRPCRouter({
  vote: voteRouter,

  list: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().nullable().optional(),
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const projectId = input?.projectId;
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const conditions = [
        eq(chat.userId, ctx.session.user.id),
        isNull(chat.deletedAt),
      ];

      if (projectId === null) {
        conditions.push(isNull(chat.projectId));
      } else if (projectId !== undefined) {
        conditions.push(eq(chat.projectId, projectId));
      }

      if (cursor) {
        const cursorChat = await ctx.db
          .select({ updatedAt: chat.updatedAt })
          .from(chat)
          .where(eq(chat.id, cursor))
          .limit(1);

        if (cursorChat[0]) {
          const cursorDate = cursorChat[0].updatedAt;
          conditions.push(
            sql`(${chat.updatedAt} < ${cursorDate} OR (${chat.updatedAt} = ${cursorDate} AND ${chat.id} < ${cursor}))`,
          );
        }
      }

      const chats = await ctx.db
        .select({
          id: chat.id,
          projectId: chat.projectId,
          remoteId: chat.remoteId,
          title: chat.title,
          status: chat.status,
          model: chat.model,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        })
        .from(chat)
        .where(and(...conditions))
        .orderBy(desc(chat.updatedAt), desc(chat.id))
        .limit(limit + 1);

      const hasMore = chats.length > limit;
      const items = hasMore ? chats.slice(0, limit) : chats;
      const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

      return {
        items,
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        projectId: z.string().nullable().optional(),
        model: activeModelIdSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyProjectOwnership(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      await ctx.db.insert(chat).values({
        id: input.id,
        userId: ctx.session.user.id,
        projectId: input.projectId ?? null,
        model: input.model ?? null,
      });

      return {
        id: input.id,
        projectId: input.projectId ?? null,
        model: input.model ?? null,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        status: z.enum(["regular", "archived"]).optional(),
        model: activeModelIdSchema.nullable().optional(),
        projectId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      if (updates.projectId !== undefined) {
        await verifyProjectOwnership(
          ctx.db,
          updates.projectId,
          ctx.session.user.id,
        );
      }

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
        .update(chat)
        .set({ deletedAt: new Date() })
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
          model: chat.model,
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

  saveMessages: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        messages: z.array(
          z.object({
            id: z.string(),
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

      if (!chatResult[0]) {
        return { saved: 0 };
      }

      const existing = await ctx.db
        .select({ id: chatMessage.id })
        .from(chatMessage)
        .where(eq(chatMessage.chatId, input.chatId));

      const persistedIds = new Set(existing.map((m) => m.id));
      const newMessages = input.messages.filter((m) => !persistedIds.has(m.id));

      if (newMessages.length === 0) {
        return { saved: 0 };
      }

      let lastParentId: string | null = null;
      for (const msg of input.messages) {
        if (persistedIds.has(msg.id)) {
          lastParentId = msg.id;
        }
      }

      const messagesToInsert = newMessages.map((msg) => {
        const parentId = lastParentId;
        lastParentId = msg.id;
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

      await ctx.db.insert(chatMessage).values(messagesToInsert);

      return { saved: newMessages.length };
    }),

  listArchived: protectedProcedure.query(async ({ ctx }) => {
    const chats = await ctx.db
      .select({
        id: chat.id,
        projectId: chat.projectId,
        title: chat.title,
        status: chat.status,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })
      .from(chat)
      .where(
        and(
          eq(chat.userId, ctx.session.user.id),
          eq(chat.status, "archived"),
          isNull(chat.deletedAt),
        ),
      )
      .orderBy(desc(chat.updatedAt));

    return chats;
  }),

  listDeleted: protectedProcedure.query(async ({ ctx }) => {
    const chats = await ctx.db
      .select({
        id: chat.id,
        projectId: chat.projectId,
        title: chat.title,
        status: chat.status,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        deletedAt: chat.deletedAt,
      })
      .from(chat)
      .where(
        and(eq(chat.userId, ctx.session.user.id), isNotNull(chat.deletedAt)),
      )
      .orderBy(desc(chat.deletedAt));

    return chats;
  }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(chat)
        .set({ deletedAt: null })
        .where(
          and(
            eq(chat.id, input.id),
            eq(chat.userId, ctx.session.user.id),
            isNotNull(chat.deletedAt),
          ),
        );

      return { success: true };
    }),

  permanentDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(chat)
        .where(
          and(
            eq(chat.id, input.id),
            eq(chat.userId, ctx.session.user.id),
            isNotNull(chat.deletedAt),
          ),
        );

      return { success: true };
    }),

  bulkUpdate: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1),
        status: z.enum(["regular", "archived"]).optional(),
        projectId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { ids, ...updates } = input;

      if (updates.projectId !== undefined) {
        await verifyProjectOwnership(
          ctx.db,
          updates.projectId,
          ctx.session.user.id,
        );
      }

      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );

      if (Object.keys(filteredUpdates).length > 0) {
        await ctx.db
          .update(chat)
          .set(filteredUpdates)
          .where(
            and(inArray(chat.id, ids), eq(chat.userId, ctx.session.user.id)),
          );
      }

      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(share)
        .where(
          and(
            eq(share.resourceType, "chat"),
            inArray(share.resourceId, input.ids),
            eq(share.userId, ctx.session.user.id),
          ),
        );

      await ctx.db
        .update(chat)
        .set({ deletedAt: new Date() })
        .where(
          and(
            inArray(chat.id, input.ids),
            eq(chat.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),
});
