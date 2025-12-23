import type { ComponentType, SVGProps } from "react";
import { OpenAI } from "@/components/icons/openai";
import { Grok } from "@/components/icons/grok";

export type ModelProvider = "openai" | "xai";

export type ModelCapability = "text" | "image" | "reasoning";

export type ModelDefinition = {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  capabilities: ModelCapability[];
};

export const AVAILABLE_MODELS: readonly ModelDefinition[] = [
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    description: "Most capable model with reasoning",
    icon: OpenAI,
    capabilities: ["text", "image", "reasoning"],
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Fast and intelligent for most tasks",
    icon: OpenAI,
    capabilities: ["text", "image"],
  },
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "xai",
    description: "xAI's capable chat model",
    icon: Grok,
    capabilities: ["text"],
  },
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    provider: "xai",
    description: "Fast reasoning model",
    icon: Grok,
    capabilities: ["text", "reasoning"],
  },
];

/** Union type of all available model IDs */
export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: ModelId = "gpt-5";

export function getModelById(modelId: string): ModelDefinition | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export function isValidModelId(modelId: string): modelId is ModelId {
  return AVAILABLE_MODELS.some((m) => m.id === modelId);
}
