import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
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

async function loadResourceData(
  db: typeof import("@/lib/database").database,
  resourceType: ShareResourceType,
  resourceId: string,
) {
  switch (resourceType) {
    case "chat": {
      const chatResult = await db
        .select({
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
        })
        .from(chat)
        .where(eq(chat.id, resourceId))
        .limit(1);

      if (!chatResult[0]) {
        return null;
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
        .where(eq(chatMessage.chatId, resourceId))
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

      const shareId = nanoid(12);
      await ctx.db.insert(share).values({
        id: shareId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        userId: ctx.session.user.id,
      });

      return { id: shareId, isNew: true };
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
          createdAt: share.createdAt,
        })
        .from(share)
        .where(eq(share.id, input.id))
        .limit(1);

      if (!shareResult[0]) {
        return null;
      }

      const shareData = shareResult[0];

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
