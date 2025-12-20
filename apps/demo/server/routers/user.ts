import { z } from "zod";
import { eq } from "drizzle-orm";

import { user } from "@/database/schema";
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
});
