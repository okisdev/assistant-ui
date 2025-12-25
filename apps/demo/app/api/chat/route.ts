import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type ToolSet,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
import type { ResolvedUserCapabilities } from "@/lib/database/types";
import { getModel, resolveModel } from "@/lib/ai/providers";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { getUserContext, type UserContext } from "@/lib/ai/context";
import { saveMemoryTool } from "@/lib/ai/tools/save-memory";
import { createArtifactTool } from "@/lib/ai/tools/create-artifact";
import { generateImageTool } from "@/lib/ai/tools/generate-image";
import { DEFAULT_CAPABILITIES } from "@/lib/ai/capabilities";
import { recordUsage } from "@/lib/ai/usage";
import type { ComposerMode } from "@/contexts/composer-mode-provider";

export const maxDuration = 300;

export async function POST(req: Request) {
  const {
    messages,
    id,
    model: requestModel,
    reasoningEnabled = true,
    composerMode = "default" as ComposerMode,
  } = await req.json();

  let userContext: UserContext | null = null;
  let capabilities: ResolvedUserCapabilities;

  try {
    userContext = await getUserContext(id);
    capabilities = userContext.capabilities;
  } catch {
    capabilities = {
      ...DEFAULT_CAPABILITIES,
      memory: {
        ...DEFAULT_CAPABILITIES.memory,
        personalization: false,
      },
    };
  }

  const modelId = await resolveModel(id, requestModel);
  const systemPrompt = userContext ? buildSystemPrompt(userContext) : "";
  const modelDef = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const provider = modelDef?.provider;

  const webSearchEnabled = capabilities.tools.webSearch;

  const providerOptions = reasoningEnabled
    ? {
        ...(provider === "openai" && {
          openai: {
            reasoningSummary: "detailed" as const,
          },
        }),
        ...(provider === "xai" && {
          xai: {
            ...(webSearchEnabled && {
              searchParameters: {
                mode: "auto" as const,
                returnCitations: true,
                maxSearchResults: 5,
                sources: [{ type: "web" as const }, { type: "news" as const }],
              },
            }),
          },
        }),
      }
    : webSearchEnabled && provider === "xai"
      ? {
          xai: {
            searchParameters: {
              mode: "auto" as const,
              returnCitations: true,
              maxSearchResults: 5,
              sources: [{ type: "web" as const }, { type: "news" as const }],
            },
          },
        }
      : undefined;

  const tools: ToolSet = {};

  if (capabilities.memory.personalization) {
    tools.save_memory = saveMemoryTool;
  }

  if (capabilities.tools.artifacts) {
    tools.create_artifact = createArtifactTool;
  }

  if (
    capabilities.tools.imageGeneration ||
    composerMode === "image-generation"
  ) {
    tools.generate_image = generateImageTool;
  }

  if (webSearchEnabled && provider === "openai") {
    tools.web_search = openai.tools.webSearch({
      searchContextSize: "low",
    });
  }

  const result = streamText({
    model: getModel(modelId),
    messages: convertToModelMessages(messages),
    system: systemPrompt || undefined,
    tools,
    toolChoice:
      composerMode === "image-generation"
        ? { type: "tool", toolName: "generate_image" }
        : undefined,
    stopWhen: stepCountIs(5),
    providerOptions,
    onFinish: async ({ usage, finishReason }) => {
      if (userContext?.userId && usage) {
        const validChatId =
          id && !id.includes("DEFAULT") && !id.includes("THREAD") ? id : null;

        recordUsage({
          userId: userContext.userId,
          chatId: validChatId,
          modelId,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          reasoningTokens: usage.reasoningTokens,
          totalTokens: usage.totalTokens ?? 0,
          finishReason,
        }).catch((error) => {
          console.error("Failed to record usage:", error);
        });
      }
    },
    onError: ({ error }) => {
      console.error("Stream error:", error);
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: reasoningEnabled,
    headers: {
      "Content-Encoding": "none",
      "Transfer-Encoding": "chunked",
      Connection: "keep-alive",
    },
  });
}
