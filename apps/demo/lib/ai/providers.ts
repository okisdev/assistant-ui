import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";
import { DEFAULT_MODEL_ID, isValidModelId } from "@/lib/ai/models";
import { api } from "@/utils/trpc/server";

type ModelFactory = () => LanguageModel;

const MODEL_REGISTRY: Record<string, ModelFactory> = {
  "gpt-5": () => openai("gpt-5"),
  "gpt-4o": () => openai("gpt-4o"),
  "grok-3": () => xai("grok-3"),
  "grok-3-mini": () => xai("grok-3-mini"),
};

export function getModel(modelId: string): LanguageModel {
  const factory = MODEL_REGISTRY[modelId];
  if (!factory) {
    console.warn(`Unknown model: ${modelId}, falling back to default`);
    return MODEL_REGISTRY[DEFAULT_MODEL_ID]!();
  }
  return factory();
}

export async function resolveModel(
  chatId: string | null,
  requestModel: string | undefined,
): Promise<string> {
  if (requestModel && isValidModelId(requestModel)) {
    return requestModel;
  }

  if (chatId) {
    try {
      const chatData = await api.chat.get({ id: chatId });
      if (chatData?.model && isValidModelId(chatData.model)) {
        return chatData.model;
      }
    } catch {
      // Chat not found or unauthorized, continue to next fallback
    }
  }

  try {
    const capabilities = await api.user.getCapabilities();
    if (
      capabilities.defaultModel &&
      isValidModelId(capabilities.defaultModel)
    ) {
      return capabilities.defaultModel;
    }
  } catch {
    // Not authenticated, use default
  }

  return DEFAULT_MODEL_ID;
}
