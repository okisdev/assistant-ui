import type { ComponentType, SVGProps } from "react";
import { OpenAI } from "@/components/icons/openai";
import { Grok } from "@/components/icons/grok";

export type ModelProvider = "openai" | "xai";

export type ModelCapability = "text" | "image" | "reasoning";

export type ModelPricing = {
  input: number;
  output: number;
};

export type ModelDefinition = {
  id: string;
  modelName: string;
  name: string;
  family: string;
  provider: ModelProvider;
  description?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  capabilities: ModelCapability[];
  pricing: ModelPricing;
  deprecated?: boolean;
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
    pricing: { input: 2.5, output: 10 },
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
    pricing: { input: 0.4, output: 1.6 },
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
    pricing: { input: 0.1, output: 0.4 },
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
    pricing: { input: 2, output: 8 },
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
    pricing: { input: 0.4, output: 1.6 },
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
    pricing: { input: 0.1, output: 0.4 },
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
    pricing: { input: 2.5, output: 10 },
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
    pricing: { input: 0.15, output: 0.6 },
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
    pricing: { input: 10, output: 40 },
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
    pricing: { input: 1.1, output: 4.4 },
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
    pricing: { input: 1.1, output: 4.4 },
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
    pricing: { input: 10, output: 30 },
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
    pricing: { input: 15, output: 60 },
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
    pricing: { input: 1.1, output: 4.4 },
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
    pricing: { input: 30, output: 60 },
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
    pricing: { input: 3, output: 15 },
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
    pricing: { input: 3, output: 15 },
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
    pricing: { input: 3, output: 15 },
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
    pricing: { input: 3, output: 15 },
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
    pricing: { input: 3, output: 15 },
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
    pricing: { input: 3, output: 15 },
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
    pricing: { input: 3, output: 15 },
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
    pricing: { input: 0.3, output: 0.5 },
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
    pricing: { input: 2, output: 10 },
    deprecated: true,
  },
];

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export const DEFAULT_MODEL_ID: ModelId = "openai/gpt-5";

export const DEFAULT_PRICING: ModelPricing = { input: 2, output: 8 };

export const ACTIVE_MODELS = AVAILABLE_MODELS.filter((m) => !m.deprecated);

export function getModelById(modelId: string): ModelDefinition | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export function getModelPricing(modelId: string): ModelPricing {
  const model = getModelById(modelId);
  return model?.pricing ?? DEFAULT_PRICING;
}

export function isValidModelId(modelId: string): modelId is ModelId {
  return AVAILABLE_MODELS.some((m) => m.id === modelId);
}

export function isDeprecatedModel(modelId: string): boolean {
  const model = getModelById(modelId);
  return model?.deprecated ?? false;
}

export function parseModelId(modelId: string): {
  provider: string;
  modelName: string;
} | null {
  const parts = modelId.split("/");
  if (parts.length !== 2) return null;
  return { provider: parts[0]!, modelName: parts[1]! };
}

export const PRIMARY_MODELS = AVAILABLE_MODELS.filter((m) => m.primary);

export const DEFAULT_ENABLED_MODEL_IDS: readonly ModelId[] = PRIMARY_MODELS.map(
  (m) => m.id as ModelId,
);

export type ImageModelId = "dall-e-2" | "dall-e-3" | "grok-2-image";

export type ImageModelDefinition = {
  id: ImageModelId;
  name: string;
  provider: ModelProvider;
  sizes: readonly string[];
  defaultSize: string;
};

export const IMAGE_MODELS: readonly ImageModelDefinition[] = [
  {
    id: "dall-e-2",
    name: "DALL-E 2",
    provider: "openai",
    sizes: ["256x256", "512x512", "1024x1024"],
    defaultSize: "512x512",
  },
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    provider: "openai",
    sizes: ["1024x1024", "1792x1024", "1024x1792"],
    defaultSize: "1024x1024",
  },
  {
    id: "grok-2-image",
    name: "Grok 2 Image",
    provider: "xai",
    sizes: ["1024x768"],
    defaultSize: "1024x768",
  },
] as const;

export const DEFAULT_IMAGE_MODEL_ID: ImageModelId = "dall-e-2";

export function getImageModelById(
  modelId: string,
): ImageModelDefinition | undefined {
  return IMAGE_MODELS.find((m) => m.id === modelId);
}
