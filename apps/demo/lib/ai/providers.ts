import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";
import {
  DEFAULT_MODEL_ID,
  getModelById,
  isValidModelId,
  type ModelProvider,
} from "@/lib/ai/models";
import { api } from "@/utils/trpc/server";

const PROVIDER_REGISTRY: Record<
  ModelProvider,
  (modelName: string) => LanguageModel
> = {
  openai: (modelName) => openai(modelName),
  xai: (modelName) => xai(modelName),
};

export function getModel(modelId: string): LanguageModel {
  const model = getModelById(modelId);
  if (!model) {
    console.warn(`Unknown model: ${modelId}, falling back to default`);
    const defaultModel = getModelById(DEFAULT_MODEL_ID)!;
    return PROVIDER_REGISTRY[defaultModel.provider](defaultModel.modelName);
  }
  return PROVIDER_REGISTRY[model.provider](model.modelName);
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
    const capabilities = await api.user.capability.list();
    if (
      capabilities.model.defaultId &&
      isValidModelId(capabilities.model.defaultId)
    ) {
      return capabilities.model.defaultId;
    }
  } catch {
    // Not authenticated, use default
  }

  return DEFAULT_MODEL_ID;
}
