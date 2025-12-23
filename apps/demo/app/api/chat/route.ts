import { convertToModelMessages, streamText, stepCountIs } from "ai";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_ID,
  DEFAULT_ENABLED_MODEL_IDS,
} from "@/lib/ai/models";
import type { ResolvedUserCapabilities } from "@/lib/database/types";
import { getModel, resolveModel } from "@/lib/ai/providers";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { getUserContext, type UserContext } from "@/lib/ai/context";
import { saveMemoryTool } from "@/lib/ai/tools/save-memory";
import { createArtifactTool } from "@/lib/ai/tools/create-artifact";

export const maxDuration = 300;

export async function POST(req: Request) {
  const {
    messages,
    id,
    model: requestModel,
    reasoningEnabled = true,
  } = await req.json();

  let userContext: UserContext | null = null;
  let capabilities: ResolvedUserCapabilities;

  try {
    userContext = await getUserContext(id);
    capabilities = userContext.capabilities;
  } catch {
    capabilities = {
      memory: {
        personalization: false,
        chatHistoryContext: false,
      },
      tools: {
        artifacts: true,
      },
      model: {
        defaultId: DEFAULT_MODEL_ID,
        reasoningEnabled: true,
      },
      models: {
        enabledIds: [...DEFAULT_ENABLED_MODEL_IDS],
      },
    };
  }

  const modelId = await resolveModel(id, requestModel);
  const systemPrompt = userContext ? buildSystemPrompt(userContext) : "";
  const modelDef = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const provider = modelDef?.provider;

  const providerOptions = reasoningEnabled
    ? {
        ...(provider === "openai" && {
          openai: {
            reasoningSummary: "auto" as const,
          },
        }),
        ...(provider === "xai" && {
          xai: {
            reasoningEffort: "high" as const,
          },
        }),
      }
    : undefined;

  const tools: Record<
    string,
    { description: string; inputSchema: import("zod").ZodType }
  > = {};

  if (capabilities.memory.personalization) {
    tools.save_memory = saveMemoryTool;
  }

  if (capabilities.tools.artifacts) {
    tools.create_artifact = createArtifactTool;
  }

  const result = streamText({
    model: getModel(modelId),
    messages: convertToModelMessages(messages),
    system: systemPrompt || undefined,
    tools,
    stopWhen: stepCountIs(5),
    providerOptions,
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: reasoningEnabled,
  });
}
