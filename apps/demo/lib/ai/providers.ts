import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import type { LanguageModel } from "ai";
import {
  DEFAULT_MODEL_ID,
  getModelById,
  type ModelProvider,
} from "@/lib/ai/models";

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
