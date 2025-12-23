import type { ComponentType, SVGProps } from "react";
import { OpenAI } from "@/components/icons/openai";
import { Grok } from "@/components/icons/grok";

export type ModelProvider = "openai" | "xai";

export type ModelCapability = "text" | "image" | "reasoning";

export type ModelDefinition = {
  /** Full model ID in format: <provider>/<model_id> */
  id: string;
  /** Model name for the provider API */
  modelName: string;
  /** Display name */
  name: string;
  /** Model family (e.g., gpt-5, grok-3) */
  family: string;
  provider: ModelProvider;
  description?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  capabilities: ModelCapability[];
  /** Whether this model is deprecated */
  deprecated?: boolean;
  /** Whether this model is enabled by default for new users */
  primary?: boolean;
};

export const AVAILABLE_MODELS: readonly ModelDefinition[] = [
  {
    id: "openai/gpt-5",
    modelName: "gpt-5",
    name: "GPT-5",
    family: "gpt-5",
    provider: "openai",
    description: "Most capable flagship model",
    icon: OpenAI,
    capabilities: ["text", "image", "reasoning"],
    primary: true,
  },
  {
    id: "openai/gpt-5-mini",
    modelName: "gpt-5-mini",
    name: "GPT-5 Mini",
    family: "gpt-5",
    provider: "openai",
    description: "Faster, cost-effective GPT-5",
    icon: OpenAI,
    capabilities: ["text", "image", "reasoning"],
  },
  {
    id: "openai/gpt-5-nano",
    modelName: "gpt-5-nano",
    name: "GPT-5 Nano",
    family: "gpt-5",
    provider: "openai",
    description: "Fastest, most affordable GPT-5",
    icon: OpenAI,
    capabilities: ["text", "image"],
  },
  {
    id: "openai/gpt-4.1",
    modelName: "gpt-4.1",
    name: "GPT-4.1",
    family: "gpt-4.1",
    provider: "openai",
    description: "Enhanced GPT-4, 1M context",
    icon: OpenAI,
    capabilities: ["text", "image", "reasoning"],
  },
  {
    id: "openai/gpt-4.1-mini",
    modelName: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    family: "gpt-4.1",
    provider: "openai",
    description: "Balanced performance, 1M context",
    icon: OpenAI,
    capabilities: ["text", "image"],
  },
  {
    id: "openai/gpt-4.1-nano",
    modelName: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    family: "gpt-4.1",
    provider: "openai",
    description: "Fast and cost-effective, 1M context",
    icon: OpenAI,
    capabilities: ["text", "image"],
  },
  {
    id: "openai/gpt-4o",
    modelName: "gpt-4o",
    name: "GPT-4o",
    family: "gpt-4o",
    provider: "openai",
    description: "Fast multimodal model, 128K context",
    icon: OpenAI,
    capabilities: ["text", "image"],
    primary: true,
  },
  {
    id: "openai/gpt-4o-mini",
    modelName: "gpt-4o-mini",
    name: "GPT-4o Mini",
    family: "gpt-4o",
    provider: "openai",
    description: "Affordable and fast, 128K context",
    icon: OpenAI,
    capabilities: ["text", "image"],
  },
  {
    id: "openai/o3",
    modelName: "o3",
    name: "o3",
    family: "o3",
    provider: "openai",
    description: "Most powerful reasoning model",
    icon: OpenAI,
    capabilities: ["text", "image", "reasoning"],
  },
  {
    id: "openai/o3-mini",
    modelName: "o3-mini",
    name: "o3 Mini",
    family: "o3",
    provider: "openai",
    description: "Fast reasoning, 200K context",
    icon: OpenAI,
    capabilities: ["text", "reasoning"],
  },
  {
    id: "openai/o4-mini",
    modelName: "o4-mini",
    name: "o4 Mini",
    family: "o4",
    provider: "openai",
    description: "Latest fast reasoning model",
    icon: OpenAI,
    capabilities: ["text", "image", "reasoning"],
  },
  {
    id: "openai/gpt-4-turbo",
    modelName: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    family: "gpt-4",
    provider: "openai",
    description: "High performance, 128K context",
    icon: OpenAI,
    capabilities: ["text", "image"],
  },
  {
    id: "openai/o1",
    modelName: "o1",
    name: "o1",
    family: "o1",
    provider: "openai",
    description: "Previous reasoning model",
    icon: OpenAI,
    capabilities: ["text", "reasoning"],
    deprecated: true,
  },
  {
    id: "openai/o1-mini",
    modelName: "o1-mini",
    name: "o1 Mini",
    family: "o1",
    provider: "openai",
    description: "Previous fast reasoning model",
    icon: OpenAI,
    capabilities: ["text", "reasoning"],
    deprecated: true,
  },
  {
    id: "openai/gpt-4",
    modelName: "gpt-4",
    name: "GPT-4",
    family: "gpt-4",
    provider: "openai",
    description: "Original GPT-4, 8K context",
    icon: OpenAI,
    capabilities: ["text", "image"],
    deprecated: true,
  },
  {
    id: "xai/grok-4-1-fast-reasoning",
    modelName: "grok-4-1-fast-reasoning",
    name: "Grok 4.1 Fast",
    family: "grok-4.1",
    provider: "xai",
    description: "Latest Grok with reasoning, 2M context",
    icon: Grok,
    capabilities: ["text", "reasoning"],
  },
  {
    id: "xai/grok-4-1-fast-non-reasoning",
    modelName: "grok-4-1-fast-non-reasoning",
    name: "Grok 4.1 Fast (No Reasoning)",
    family: "grok-4.1",
    provider: "xai",
    description: "Latest Grok without reasoning, 2M context",
    icon: Grok,
    capabilities: ["text"],
  },
  {
    id: "xai/grok-4-fast-reasoning",
    modelName: "grok-4-fast-reasoning",
    name: "Grok 4 Fast",
    family: "grok-4",
    provider: "xai",
    description: "Fast Grok 4 with reasoning, 2M context",
    icon: Grok,
    capabilities: ["text", "reasoning"],
  },
  {
    id: "xai/grok-4-fast-non-reasoning",
    modelName: "grok-4-fast-non-reasoning",
    name: "Grok 4 Fast (No Reasoning)",
    family: "grok-4",
    provider: "xai",
    description: "Fast Grok 4 without reasoning, 2M context",
    icon: Grok,
    capabilities: ["text"],
  },
  {
    id: "xai/grok-4-0709",
    modelName: "grok-4-0709",
    name: "Grok 4",
    family: "grok-4",
    provider: "xai",
    description: "Full Grok 4 model, 256K context",
    icon: Grok,
    capabilities: ["text", "reasoning"],
  },
  {
    id: "xai/grok-code-fast-1",
    modelName: "grok-code-fast-1",
    name: "Grok Code Fast",
    family: "grok-code",
    provider: "xai",
    description: "Optimized for coding tasks, 256K context",
    icon: Grok,
    capabilities: ["text"],
  },
  {
    id: "xai/grok-3",
    modelName: "grok-3",
    name: "Grok 3",
    family: "grok-3",
    provider: "xai",
    description: "Capable model, 131K context",
    icon: Grok,
    capabilities: ["text"],
    primary: true,
  },
  {
    id: "xai/grok-3-mini",
    modelName: "grok-3-mini",
    name: "Grok 3 Mini",
    family: "grok-3",
    provider: "xai",
    description: "Fast and efficient, 131K context",
    icon: Grok,
    capabilities: ["text"],
  },
  {
    id: "xai/grok-2-vision-1212",
    modelName: "grok-2-vision-1212",
    name: "Grok 2 Vision",
    family: "grok-2",
    provider: "xai",
    description: "Vision model, 32K context",
    icon: Grok,
    capabilities: ["text", "image"],
    deprecated: true,
  },
];

/** Union type of all available model IDs */
export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: ModelId = "openai/gpt-5";

/** Get all non-deprecated models */
export const ACTIVE_MODELS = AVAILABLE_MODELS.filter((m) => !m.deprecated);

export function getModelById(modelId: string): ModelDefinition | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export function isValidModelId(modelId: string): modelId is ModelId {
  return AVAILABLE_MODELS.some((m) => m.id === modelId);
}

/** Check if a model is deprecated */
export function isDeprecatedModel(modelId: string): boolean {
  const model = getModelById(modelId);
  return model?.deprecated ?? false;
}

/** Parse model ID into provider and model name */
export function parseModelId(modelId: string): {
  provider: string;
  modelName: string;
} | null {
  const parts = modelId.split("/");
  if (parts.length !== 2) return null;
  return { provider: parts[0]!, modelName: parts[1]! };
}

/** Get primary models (enabled by default for new users) */
export const PRIMARY_MODELS = AVAILABLE_MODELS.filter((m) => m.primary);

/** Get default enabled model IDs for new users */
export const DEFAULT_ENABLED_MODEL_IDS: readonly ModelId[] = PRIMARY_MODELS.map(
  (m) => m.id as ModelId,
);
