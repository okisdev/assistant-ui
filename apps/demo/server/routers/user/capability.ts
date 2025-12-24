import { z } from "zod";
import { eq } from "drizzle-orm";

import {
  user,
  type UserCapabilities,
  type ChainOfThoughtMode,
} from "@/lib/database/schema";
import type { ResolvedUserCapabilities } from "@/lib/database/types";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_ID,
  DEFAULT_ENABLED_MODEL_IDS,
  type ModelId,
} from "@/lib/ai/models";
import { protectedProcedure, createTRPCRouter } from "../../trpc";

const chainOfThoughtSchema = z.enum(["off", "zero-shot", "few-shot"] as const);

const modelIdSchema = z.enum(
  AVAILABLE_MODELS.map((m) => m.id) as [ModelId, ...ModelId[]],
);

export const capabilityRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ capabilities: user.capabilities })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);

    const capabilities = result[0]?.capabilities ?? {};

    return {
      memory: {
        personalization: capabilities.memory?.personalization ?? true,
        chatHistoryContext: capabilities.memory?.chatHistoryContext ?? false,
      },
      tools: {
        artifacts: capabilities.tools?.artifacts ?? true,
        webSearch: capabilities.tools?.webSearch ?? false,
      },
      model: {
        defaultId: capabilities.model?.defaultId ?? DEFAULT_MODEL_ID,
        reasoningEnabled: capabilities.model?.reasoningEnabled ?? true,
      },
      models: {
        enabledIds: capabilities.models?.enabledIds ?? [
          ...DEFAULT_ENABLED_MODEL_IDS,
        ],
      },
      prompting: {
        chainOfThought:
          (capabilities.prompting?.chainOfThought as ChainOfThoughtMode) ??
          "off",
      },
    } satisfies ResolvedUserCapabilities;
  }),

  update: protectedProcedure
    .input(
      z.object({
        memory: z
          .object({
            personalization: z.boolean().optional(),
            chatHistoryContext: z.boolean().optional(),
          })
          .optional(),
        tools: z
          .object({
            artifacts: z.boolean().optional(),
            webSearch: z.boolean().optional(),
          })
          .optional(),
        model: z
          .object({
            defaultId: modelIdSchema.optional(),
            reasoningEnabled: z.boolean().optional(),
          })
          .optional(),
        models: z
          .object({
            enabledIds: z.array(modelIdSchema).optional(),
          })
          .optional(),
        prompting: z
          .object({
            chainOfThought: chainOfThoughtSchema.optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ capabilities: user.capabilities })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      const current = result[0]?.capabilities ?? {};

      const updated: UserCapabilities = {
        memory: {
          ...current.memory,
          ...(input.memory?.personalization !== undefined && {
            personalization: input.memory.personalization,
          }),
          ...(input.memory?.chatHistoryContext !== undefined && {
            chatHistoryContext: input.memory.chatHistoryContext,
          }),
        },
        tools: {
          ...current.tools,
          ...(input.tools?.artifacts !== undefined && {
            artifacts: input.tools.artifacts,
          }),
          ...(input.tools?.webSearch !== undefined && {
            webSearch: input.tools.webSearch,
          }),
        },
        model: {
          ...current.model,
          ...(input.model?.defaultId !== undefined && {
            defaultId: input.model.defaultId,
          }),
          ...(input.model?.reasoningEnabled !== undefined && {
            reasoningEnabled: input.model.reasoningEnabled,
          }),
        },
        models: {
          ...current.models,
          ...(input.models?.enabledIds !== undefined && {
            enabledIds: input.models.enabledIds,
          }),
        },
        prompting: {
          ...current.prompting,
          ...(input.prompting?.chainOfThought !== undefined && {
            chainOfThought: input.prompting.chainOfThought,
          }),
        },
      };

      await ctx.db
        .update(user)
        .set({ capabilities: updated })
        .where(eq(user.id, ctx.session.user.id));

      return { success: true };
    }),
});
