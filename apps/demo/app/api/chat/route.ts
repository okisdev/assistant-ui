import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type ToolSet,
} from "ai";
import { openai } from "@ai-sdk/openai";
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
        webSearch: false,
      },
      model: {
        defaultId: DEFAULT_MODEL_ID,
        reasoningEnabled: true,
      },
      models: {
        enabledIds: [...DEFAULT_ENABLED_MODEL_IDS],
      },
      prompting: {
        chainOfThought: "off",
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
    stopWhen: stepCountIs(5),
    providerOptions,
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: reasoningEnabled,
    headers: {
      // Disable content encoding to prevent buffering in proxied environments
      "Content-Encoding": "none",
      // Enable chunked transfer for proper streaming
      "Transfer-Encoding": "chunked",
      Connection: "keep-alive",
    },
  });
}
