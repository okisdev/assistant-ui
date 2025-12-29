import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type ToolSet,
} from "ai";
import { nanoid } from "nanoid";
import { openai } from "@ai-sdk/openai";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
import { getModel } from "@/lib/ai/providers";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import {
  getChatContext,
  getDefaultCapabilities,
  type ChatContext,
} from "@/lib/ai/context";
import { saveMemoryTool } from "@/lib/ai/tools/save-memory";
import { createArtifactTool } from "@/lib/ai/tools/create-artifact";
import { generateImageTool } from "@/lib/ai/tools/generate-image";
import { getAppTools } from "@/lib/ai/tools/apps";
import { recordUsage } from "@/lib/ai/usage";
import { getMCPTools, closeMCPClients } from "@/lib/ai/mcp";
import { api } from "@/utils/trpc/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";
import type { ComposerMode } from "@/contexts/composer-state-provider";

export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const {
    messages,
    id,
    model: requestModel,
    reasoningEnabled = true,
    composerMode = "default" as ComposerMode,
    selectedAppIds = [] as string[],
  } = await req.json();

  const [contextResult, mcpResult] = await Promise.all([
    getChatContext({ chatId: id, requestModel }).catch(() => null),
    getMCPTools(),
  ]);

  const ctx: ChatContext | null = contextResult;
  const capabilities = ctx?.capabilities ?? getDefaultCapabilities();
  const modelId = ctx?.resolvedModelId ?? requestModel ?? "gpt-4o";

  const {
    tools: mcpTools,
    clients: mcpClients,
    toolInfos: mcpToolInfos,
  } = mcpResult;

  const modelDef = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const provider = modelDef?.provider;
  const webSearchEnabled = capabilities.tools.webSearch;

  const providerOptions = buildProviderOptions(
    provider,
    reasoningEnabled,
    webSearchEnabled,
  );

  const tools = buildTools(
    capabilities,
    composerMode,
    provider,
    webSearchEnabled,
    mcpTools,
  );

  if (ctx && ctx.connectedApps.length > 0) {
    const appTools = await getAppTools(ctx.connectedApps, selectedAppIds);
    Object.assign(tools, appTools);
  }

  const systemPrompt = ctx
    ? buildSystemPrompt(ctx, mcpToolInfos, selectedAppIds)
    : "";

  const result = streamText({
    model: getModel(modelId),
    messages: convertToModelMessages(messages),
    system: systemPrompt || undefined,
    tools,
    toolChoice:
      composerMode === "image-generation"
        ? { type: "tool", toolName: "generate_image" }
        : undefined,
    stopWhen: stepCountIs(20),
    providerOptions,
    onFinish: async ({ usage, finishReason }) => {
      await closeMCPClients(mcpClients);

      if (ctx?.userId && usage) {
        const validChatId =
          id && !id.includes("DEFAULT") && !id.includes("THREAD") ? id : null;

        recordUsage({
          userId: ctx.userId,
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

  result.consumeStream();

  return result.toUIMessageStreamResponse({
    sendReasoning: reasoningEnabled,
    originalMessages: messages,
    generateMessageId: () => nanoid(),
    onFinish: async ({ messages: allMessages }) => {
      if (id && !id.includes("incognito")) {
        const validChatId =
          id && !id.includes("DEFAULT") && !id.includes("THREAD") ? id : null;

        if (validChatId) {
          try {
            await api.chat.saveMessages({
              chatId: validChatId,
              messages: allMessages.map((m) => ({
                id: m.id,
                role: m.role,
                parts: m.parts,
              })),
            });
          } catch (error) {
            console.error("Failed to save messages:", error);
          }
        }
      }
    },
    headers: {
      "Content-Encoding": "none",
      "Transfer-Encoding": "chunked",
      Connection: "keep-alive",
    },
  });
}

function buildProviderOptions(
  provider: string | undefined,
  reasoningEnabled: boolean,
  webSearchEnabled: boolean,
) {
  if (reasoningEnabled) {
    return {
      ...(provider === "openai" && {
        openai: { reasoningSummary: "detailed" as const },
      }),
      ...(provider === "xai" &&
        webSearchEnabled && {
          xai: {
            searchParameters: {
              mode: "auto" as const,
              returnCitations: true,
              maxSearchResults: 5,
              sources: [{ type: "web" as const }, { type: "news" as const }],
            },
          },
        }),
    };
  }

  if (webSearchEnabled && provider === "xai") {
    return {
      xai: {
        searchParameters: {
          mode: "auto" as const,
          returnCitations: true,
          maxSearchResults: 5,
          sources: [{ type: "web" as const }, { type: "news" as const }],
        },
      },
    };
  }

  return undefined;
}

function buildTools(
  capabilities: ReturnType<typeof getDefaultCapabilities>,
  composerMode: ComposerMode,
  provider: string | undefined,
  webSearchEnabled: boolean,
  mcpTools: ToolSet,
): ToolSet {
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
    tools.web_search = openai.tools.webSearch({ searchContextSize: "low" });
  }

  Object.assign(tools, mcpTools);

  return tools;
}
