import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { user } from "@/database/schema";
import { rateLimiters } from "@/lib/rate-limit";
import { publicProcedure, createTRPCRouter } from "../trpc";

export const authRouter = createTRPCRouter({
  checkEmailExists: publicProcedure
    .input(z.object({ email: z.email() }))
    .mutation(async ({ ctx, input }) => {
      const ip =
        ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        ctx.headers.get("x-real-ip") ??
        "unknown";

      const { success } = rateLimiters.auth.check(ip);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please try again later.",
        });
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 300 + Math.random() * 200),
      );

      const existingUser = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, input.email.toLowerCase()))
        .limit(1);

      return { exists: existingUser.length > 0 };
    }),
});
