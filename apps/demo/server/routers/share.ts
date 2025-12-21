import { z } from "zod";
import { eq, and, desc, lte, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

import {
  share,
  chat,
  chatMessage,
  user,
  type ShareResourceType,
} from "@/lib/database/schema";
import { protectedProcedure, publicProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";

const resourceTypeSchema = z.enum(["chat"]) as z.ZodType<ShareResourceType>;

async function verifyResourceOwnership(
  db: typeof import("@/lib/database").database,
  userId: string,
  resourceType: ShareResourceType,
  resourceId: string,
): Promise<boolean> {
  switch (resourceType) {
    case "chat": {
      const result = await db
        .select({ id: chat.id })
        .from(chat)
        .where(and(eq(chat.id, resourceId), eq(chat.userId, userId)))
        .limit(1);
      return result.length > 0;
    }
    default:
      return false;
  }
}

async function getBranchMessageIds(
  db: typeof import("@/lib/database").database,
  chatId: string,
  headMessageId: string,
): Promise<string[]> {
  // Get all messages for this chat
  const allMessages = await db
    .select({
      id: chatMessage.id,
      parentId: chatMessage.parentId,
    })
    .from(chatMessage)
    .where(eq(chatMessage.chatId, chatId));

  // Build a map for quick lookup
  const messageMap = new Map(allMessages.map((m) => [m.id, m.parentId]));

  // Traverse from head to root
  const branchIds: string[] = [];
  let currentId: string | null = headMessageId;

  while (currentId) {
    branchIds.push(currentId);
    currentId = messageMap.get(currentId) ?? null;
  }

  return branchIds;
}

async function loadResourceData(
  db: typeof import("@/lib/database").database,
  resourceType: ShareResourceType,
  resourceId: string,
  options?: {
    snapshotAt?: Date | null;
    includeBranches?: boolean;
    headMessageId?: string | null;
  },
) {
  switch (resourceType) {
    case "chat": {
      const chatResult = await db
        .select({
          id: chat.id,
          title: chat.title,
          headMessageId: chat.headMessageId,
          createdAt: chat.createdAt,
        })
        .from(chat)
        .where(eq(chat.id, resourceId))
        .limit(1);

      if (!chatResult[0]) {
        return null;
      }

      const conditions = [eq(chatMessage.chatId, resourceId)];

      // If not including branches, filter to current branch only
      if (!options?.includeBranches && options?.headMessageId) {
        const branchIds = await getBranchMessageIds(
          db,
          resourceId,
          options.headMessageId,
        );
        if (branchIds.length > 0) {
          conditions.push(inArray(chatMessage.id, branchIds));
        }
      }

      if (options?.snapshotAt) {
        conditions.push(lte(chatMessage.createdAt, options.snapshotAt));
      }

      const messages = await db
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
        .where(and(...conditions))
        .orderBy(chatMessage.createdAt);

      return {
        type: "chat" as const,
        chat: chatResult[0],
        messages,
      };
    }
    default:
      return null;
  }
}

export const shareRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        resourceType: resourceTypeSchema,
        resourceId: z.string(),
        isPublic: z.boolean().optional(),
        includesFutureMessages: z.boolean().optional(),
        includeBranches: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const hasAccess = await verifyResourceOwnership(
        ctx.db,
        ctx.session.user.id,
        input.resourceType,
        input.resourceId,
      );

      if (!hasAccess) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found or access denied",
        });
      }

      const existing = await ctx.db
        .select({ id: share.id })
        .from(share)
        .where(
          and(
            eq(share.resourceType, input.resourceType),
            eq(share.resourceId, input.resourceId),
            eq(share.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (existing[0]) {
        return { id: existing[0].id, isNew: false };
      }

      // Get current head message ID for branch tracking
      let headMessageId: string | null = null;
      if (input.resourceType === "chat" && !input.includeBranches) {
        const chatResult = await ctx.db
          .select({ headMessageId: chat.headMessageId })
          .from(chat)
          .where(eq(chat.id, input.resourceId))
          .limit(1);
        headMessageId = chatResult[0]?.headMessageId ?? null;
      }

      const shareId = nanoid(12);
      const isPublic = input.isPublic ?? true;
      const snapshotAt =
        input.includesFutureMessages === false ? new Date() : null;
      const includeBranches = input.includeBranches ?? false;

      await ctx.db.insert(share).values({
        id: shareId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        userId: ctx.session.user.id,
        isPublic,
        snapshotAt,
        includeBranches,
        headMessageId,
      });

      return { id: shareId, isNew: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isPublic: z.boolean().optional(),
        includesFutureMessages: z.boolean().optional(),
        includeBranches: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select({
          id: share.id,
          resourceType: share.resourceType,
          resourceId: share.resourceId,
          snapshotAt: share.snapshotAt,
          includeBranches: share.includeBranches,
        })
        .from(share)
        .where(
          and(eq(share.id, input.id), eq(share.userId, ctx.session.user.id)),
        )
        .limit(1);

      if (!existing[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share not found",
        });
      }

      const updates: {
        isPublic?: boolean;
        snapshotAt?: Date | null;
        includeBranches?: boolean;
        headMessageId?: string | null;
      } = {};

      if (input.isPublic !== undefined) {
        updates.isPublic = input.isPublic;
      }

      if (input.includesFutureMessages !== undefined) {
        if (input.includesFutureMessages) {
          updates.snapshotAt = null;
        } else if (!existing[0].snapshotAt) {
          updates.snapshotAt = new Date();
        }
      }

      if (input.includeBranches !== undefined) {
        updates.includeBranches = input.includeBranches;

        // If switching to single branch, capture current head
        if (!input.includeBranches && existing[0].resourceType === "chat") {
          const chatResult = await ctx.db
            .select({ headMessageId: chat.headMessageId })
            .from(chat)
            .where(eq(chat.id, existing[0].resourceId))
            .limit(1);
          updates.headMessageId = chatResult[0]?.headMessageId ?? null;
        } else if (input.includeBranches) {
          updates.headMessageId = null;
        }
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.update(share).set(updates).where(eq(share.id, input.id));
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(share)
        .where(
          and(eq(share.id, input.id), eq(share.userId, ctx.session.user.id)),
        );

      return { success: true };
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          resourceType: resourceTypeSchema.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(share.userId, ctx.session.user.id)];

      if (input?.resourceType) {
        conditions.push(eq(share.resourceType, input.resourceType));
      }

      const shares = await ctx.db
        .select({
          id: share.id,
          resourceType: share.resourceType,
          resourceId: share.resourceId,
          isPublic: share.isPublic,
          snapshotAt: share.snapshotAt,
          includeBranches: share.includeBranches,
          createdAt: share.createdAt,
        })
        .from(share)
        .where(and(...conditions))
        .orderBy(desc(share.createdAt));

      const enrichedShares = await Promise.all(
        shares.map(async (s) => {
          let title: string | null = null;

          if (s.resourceType === "chat") {
            const chatResult = await ctx.db
              .select({ title: chat.title })
              .from(chat)
              .where(eq(chat.id, s.resourceId))
              .limit(1);
            title = chatResult[0]?.title ?? null;
          }

          return { ...s, title };
        }),
      );

      return enrichedShares;
    }),

  getByResource: protectedProcedure
    .input(
      z.object({
        resourceType: resourceTypeSchema,
        resourceId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: share.id,
          isPublic: share.isPublic,
          snapshotAt: share.snapshotAt,
          includeBranches: share.includeBranches,
          createdAt: share.createdAt,
        })
        .from(share)
        .where(
          and(
            eq(share.resourceType, input.resourceType),
            eq(share.resourceId, input.resourceId),
            eq(share.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    }),

  getPublic: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const shareResult = await ctx.db
        .select({
          id: share.id,
          resourceType: share.resourceType,
          resourceId: share.resourceId,
          userId: share.userId,
          isPublic: share.isPublic,
          snapshotAt: share.snapshotAt,
          includeBranches: share.includeBranches,
          headMessageId: share.headMessageId,
          createdAt: share.createdAt,
        })
        .from(share)
        .where(eq(share.id, input.id))
        .limit(1);

      if (!shareResult[0]) {
        return null;
      }

      const shareData = shareResult[0];

      // Check if share is public
      if (!shareData.isPublic) {
        return null;
      }

      const userResult = await ctx.db
        .select({
          name: user.name,
          image: user.image,
        })
        .from(user)
        .where(eq(user.id, shareData.userId))
        .limit(1);

      const resourceData = await loadResourceData(
        ctx.db,
        shareData.resourceType as ShareResourceType,
        shareData.resourceId,
        {
          snapshotAt: shareData.snapshotAt,
          includeBranches: shareData.includeBranches,
          headMessageId: shareData.headMessageId,
        },
      );

      if (!resourceData) {
        return null;
      }

      return {
        share: {
          id: shareData.id,
          createdAt: shareData.createdAt,
        },
        sharer: userResult[0] ?? { name: "Unknown", image: null },
        resource: resourceData,
      };
    }),
});
