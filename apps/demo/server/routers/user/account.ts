import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";

import { account } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../../trpc";

export const accountRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
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

  unlink: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
});
