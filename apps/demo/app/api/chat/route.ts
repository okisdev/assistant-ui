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
import { updateMemoryTool } from "@/lib/ai/tools/update-memory";
import { deleteMemoryTool } from "@/lib/ai/tools/delete-memory";
import { createArtifactTool } from "@/lib/ai/tools/create-artifact";
import { generateImageTool } from "@/lib/ai/tools/generate-image";
import { getAppTools } from "@/lib/ai/tools/apps";
import { getMCPTools, closeMCPClients } from "@/lib/ai/mcp";
import { getSession } from "@/lib/auth";
import type { ComposerMode } from "@/contexts/composer-state-provider";
import { AUIError } from "@/lib/error";
import { debug } from "@/lib/debug";
import { api } from "@/utils/trpc/server";

export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return AUIError.unauthorized().toResponse();
  }

  const {
    messages,
    id,
    model: requestModel,
    reasoningEnabled = true,
    composerMode = "default" as ComposerMode,
    selectedAppIds = [] as string[],
    isIncognito = false,
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

  // Save user message immediately for data safety
  debug.chat("Save user message check", {
    isIncognito,
    id,
    validChatId: getValidChatId(id),
    messagesLength: messages.length,
    lastMessageRole: messages[messages.length - 1]?.role,
  });

  if (!isIncognito) {
    const validChatId = getValidChatId(id);
    if (validChatId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // Compute parentId from the messages array
        const parentId =
          messages.length > 1
            ? (messages[messages.length - 2]?.id ?? null)
            : null;
        debug.chat("Saving user message", {
          chatId: validChatId,
          messageId: lastMessage.id,
          parentId,
          parts: lastMessage.parts,
        });
        api.chat.message
          .save({
            chatId: validChatId,
            messages: [
              {
                id: lastMessage.id,
                parentId,
                role: lastMessage.role,
                parts: lastMessage.parts,
              },
            ],
          })
          .then((result) => {
            debug.chat.success("User message saved", result);
          })
          .catch((error) => {
            debug.chat.error("Failed to save user message", error);
          });
      }
    }
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
    stopWhen: stepCountIs(20),
    providerOptions,
    onFinish: async ({ usage, finishReason }) => {
      await closeMCPClients(mcpClients);

      if (ctx?.userId && usage) {
        const validChatId = getValidChatId(id);

        api.usage
          .record({
            chatId: validChatId,
            modelId,
            inputTokens: usage.inputTokens ?? 0,
            outputTokens: usage.outputTokens ?? 0,
            reasoningTokens: usage.reasoningTokens,
            totalTokens: usage.totalTokens ?? 0,
            finishReason,
          })
          .catch((error) => {
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
    messageMetadata: ({ part }) => {
      if (part.type === "finish") {
        return {
          usage: {
            inputTokens: part.totalUsage.inputTokens,
            outputTokens: part.totalUsage.outputTokens,
            totalTokens: part.totalUsage.totalTokens,
            reasoningTokens: part.totalUsage.reasoningTokens,
          },
        };
      }
    },
    onFinish: async ({ messages: allMessages }) => {
      debug.chat("onFinish called", {
        isIncognito,
        id,
        validChatId: getValidChatId(id),
        allMessagesCount: allMessages.length,
        allMessages: allMessages.map((m) => ({
          id: m.id,
          role: m.role,
          partsCount: m.parts?.length,
        })),
      });

      if (!isIncognito) {
        const validChatId = getValidChatId(id);

        if (validChatId) {
          try {
            const messagesToSave = allMessages.map((m, idx) => ({
              id: m.id,
              parentId: idx > 0 ? (allMessages[idx - 1]?.id ?? null) : null,
              role: m.role,
              parts: m.parts,
            }));
            debug.chat("Saving messages", {
              chatId: validChatId,
              messagesCount: messagesToSave.length,
            });
            const result = await api.chat.message.save({
              chatId: validChatId,
              messages: messagesToSave,
            });
            debug.chat.success("messages saved", result);
          } catch (error) {
            debug.chat.error("Failed to save messages", error);
          }
        } else {
          debug.chat.warn("Skipping save - no valid chatId");
        }
      } else {
        debug.chat.info("Skipping save - incognito mode");
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

function getValidChatId(id: string | undefined): string | null {
  if (!id) return null;
  if (id.includes("DEFAULT") || id.includes("THREAD")) return null;
  return id;
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
    tools.update_memory = updateMemoryTool;
    tools.delete_memory = deleteMemoryTool;
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
