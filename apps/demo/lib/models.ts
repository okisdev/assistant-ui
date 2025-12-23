import type { ComponentType, SVGProps } from "react";
import { OpenAI } from "@/components/icons/openai";
import { Grok } from "@/components/icons/grok";

export type ModelProvider = "openai" | "xai";

export type ModelDefinition = {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const AVAILABLE_MODELS: readonly ModelDefinition[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable GPT-4 model",
    icon: OpenAI,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and efficient",
    icon: OpenAI,
  },
  {
    id: "grok-4",
    name: "Grok 4",
    provider: "xai",
    description: "xAI's latest model",
    icon: Grok,
  },
];

/** Union type of all available model IDs */
export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: ModelId = "gpt-4o";

export function getModelById(modelId: string): ModelDefinition | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export function isValidModelId(modelId: string): modelId is ModelId {
  return AVAILABLE_MODELS.some((m) => m.id === modelId);
}
