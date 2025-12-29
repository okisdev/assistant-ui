import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";

import { account } from "@/lib/database/schema";
import { auth } from "@/lib/auth";
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

  hasPassword: protectedProcedure.query(async ({ ctx }) => {
    const credentialAccount = await ctx.db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, ctx.session.user.id),
          eq(account.providerId, "credential"),
        ),
      )
      .limit(1);

    return credentialAccount.length > 0;
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

  setPassword: protectedProcedure
    .input(z.object({ newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const hasCredential = await ctx.db
        .select({ id: account.id })
        .from(account)
        .where(
          and(
            eq(account.userId, ctx.session.user.id),
            eq(account.providerId, "credential"),
          ),
        )
        .limit(1);

      if (hasCredential.length > 0) {
        throw new Error("Password already set. Use change password instead.");
      }

      await auth.api.setPassword({
        body: { newPassword: input.newPassword },
        headers: ctx.headers,
      });

      return { success: true };
    }),
});
