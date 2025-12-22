import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";

import { user, account, type UserCapabilities } from "@/lib/database/schema";
import { workTypeOptions } from "@/lib/constants";
import { protectedProcedure, createTRPCRouter } from "../trpc";

const workTypeSchema = z.enum([
  workTypeOptions[0].value,
  ...workTypeOptions.slice(1).map((o) => o.value),
]);

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        nickname: user.nickname,
        workType: user.workType,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);

    return result[0] ?? null;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        nickname: z.string().max(50).optional().nullable(),
        workType: workTypeSchema.optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(user)
        .set({
          name: input.name,
          nickname: input.nickname,
          workType: input.workType,
        })
        .where(eq(user.id, ctx.session.user.id));

      return { success: true };
    }),

  getConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.db
      .select({
        id: account.id,
        providerId: account.providerId,
        accountId: account.accountId,
        createdAt: account.createdAt,
      })
      .from(account)
      .where(
        and(
          eq(account.userId, ctx.session.user.id),
          ne(account.providerId, "credential"),
        ),
      );

    return accounts;
  }),

  unlinkAccount: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has other login methods before unlinking
      const userAccounts = await ctx.db
        .select({ providerId: account.providerId })
        .from(account)
        .where(eq(account.userId, ctx.session.user.id));

      const hasCredential = userAccounts.some(
        (a) => a.providerId === "credential",
      );
      const oauthAccounts = userAccounts.filter(
        (a) => a.providerId !== "credential",
      );

      // Prevent unlinking if it's the only login method
      if (!hasCredential && oauthAccounts.length <= 1) {
        throw new Error(
          "Cannot unlink the only login method. Add a password or another provider first.",
        );
      }

      await ctx.db
        .delete(account)
        .where(
          and(
            eq(account.userId, ctx.session.user.id),
            eq(account.providerId, input.providerId),
          ),
        );

      return { success: true };
    }),

  getCapabilities: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ capabilities: user.capabilities })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);

    const capabilities = result[0]?.capabilities ?? {};

    // Return with defaults
    return {
      personalization: capabilities.personalization ?? true,
      chatHistoryContext: capabilities.chatHistoryContext ?? false,
      artifacts: capabilities.artifacts ?? true,
    } satisfies Required<UserCapabilities>;
  }),

  updateCapabilities: protectedProcedure
    .input(
      z.object({
        personalization: z.boolean().optional(),
        chatHistoryContext: z.boolean().optional(),
        artifacts: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current capabilities
      const result = await ctx.db
        .select({ capabilities: user.capabilities })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      const current = result[0]?.capabilities ?? {};

      // Merge with new values
      const updated: UserCapabilities = {
        ...current,
        ...(input.personalization !== undefined && {
          personalization: input.personalization,
        }),
        ...(input.chatHistoryContext !== undefined && {
          chatHistoryContext: input.chatHistoryContext,
        }),
        ...(input.artifacts !== undefined && {
          artifacts: input.artifacts,
        }),
      };

      await ctx.db
        .update(user)
        .set({ capabilities: updated })
        .where(eq(user.id, ctx.session.user.id));

      return { success: true };
    }),
});
