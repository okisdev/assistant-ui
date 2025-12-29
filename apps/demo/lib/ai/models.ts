import type { ComponentType, SVGProps } from "react";
import { OpenAI } from "@/components/icons/openai";
import { Grok } from "@/components/icons/grok";

export type ModelProvider = "openai" | "xai";

export type ModelType = "chat" | "image-generation";

export type ModelCapability =
  | "text"
  | "vision" // Can accept image attachments
  | "reasoning"
  | "image-generation";

export type ModelPricing = {
  // For chat models (per million tokens)
  input?: number;
  output?: number;
  // For image generation models (per image)
  perImage?: number;
};

export type ImageGenerationConfig = {
  sizes: readonly string[];
  defaultSize: string;
  qualities?: readonly string[];
};

export type ModelDefinition = {
  id: string;
  modelName: string;
  name: string;
  family: string;
  provider: ModelProvider;
  type: ModelType;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  capabilities: ModelCapability[];
  pricing: ModelPricing;
  // Context and output limits
  contextWindow?: number; // Max input tokens
  maxOutputTokens?: number; // Max output tokens
  // Metadata
  deprecated?: boolean;
  primary?: boolean;
  // Image generation specific
  imageGenConfig?: ImageGenerationConfig;
};

export const AVAILABLE_MODELS: readonly ModelDefinition[] = [
  // ============================================
  // CHAT MODELS - OPENAI
  // ============================================

  // OpenAI GPT-5.2 Family (Latest)
  {
    id: "openai/gpt-5.2",
    modelName: "gpt-5.2",
    name: "GPT-5.2",
    family: "gpt-5.2",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 3, output: 12 },
    contextWindow: 256000,
    maxOutputTokens: 32768,
    primary: true,
  },
  {
    id: "openai/gpt-5.2-pro",
    modelName: "gpt-5.2-pro",
    name: "GPT-5.2 Pro",
    family: "gpt-5.2",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 5, output: 20 },
    contextWindow: 256000,
    maxOutputTokens: 32768,
  },

  // OpenAI GPT-5 Family
  {
    id: "openai/gpt-5",
    modelName: "gpt-5",
    name: "GPT-5",
    family: "gpt-5",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 2.5, output: 10 },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    primary: true,
  },
  {
    id: "openai/gpt-5-mini",
    modelName: "gpt-5-mini",
    name: "GPT-5 Mini",
    family: "gpt-5",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 0.4, output: 1.6 },
    contextWindow: 128000,
    maxOutputTokens: 16384,
  },
  {
    id: "openai/gpt-5-nano",
    modelName: "gpt-5-nano",
    name: "GPT-5 Nano",
    family: "gpt-5",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 0.1, output: 0.4 },
    contextWindow: 128000,
    maxOutputTokens: 16384,
  },

  // OpenAI GPT-4.1 Family
  {
    id: "openai/gpt-4.1",
    modelName: "gpt-4.1",
    name: "GPT-4.1",
    family: "gpt-4.1",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 2, output: 8 },
    contextWindow: 1000000,
    maxOutputTokens: 32768,
  },
  {
    id: "openai/gpt-4.1-mini",
    modelName: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    family: "gpt-4.1",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 0.4, output: 1.6 },
    contextWindow: 1000000,
    maxOutputTokens: 32768,
  },
  {
    id: "openai/gpt-4.1-nano",
    modelName: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    family: "gpt-4.1",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 0.1, output: 0.4 },
    contextWindow: 1000000,
    maxOutputTokens: 32768,
  },

  // OpenAI GPT-4o Family
  {
    id: "openai/gpt-4o",
    modelName: "gpt-4o",
    name: "GPT-4o",
    family: "gpt-4o",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 2.5, output: 10 },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    primary: true,
  },
  {
    id: "openai/gpt-4o-mini",
    modelName: "gpt-4o-mini",
    name: "GPT-4o Mini",
    family: "gpt-4o",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 0.15, output: 0.6 },
    contextWindow: 128000,
    maxOutputTokens: 16384,
  },

  // OpenAI o-series (Reasoning)
  {
    id: "openai/o3",
    modelName: "o3",
    name: "o3",
    family: "o3",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 10, output: 40 },
    contextWindow: 200000,
    maxOutputTokens: 100000,
  },
  {
    id: "openai/o3-mini",
    modelName: "o3-mini",
    name: "o3 Mini",
    family: "o3",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "reasoning"],
    pricing: { input: 1.1, output: 4.4 },
    contextWindow: 200000,
    maxOutputTokens: 100000,
  },
  {
    id: "openai/o3-deep-research",
    modelName: "o3-deep-research",
    name: "o3 Deep Research",
    family: "o3",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 15, output: 60 },
    contextWindow: 200000,
    maxOutputTokens: 100000,
  },
  {
    id: "openai/o4-mini",
    modelName: "o4-mini",
    name: "o4 Mini",
    family: "o4",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 1.1, output: 4.4 },
    contextWindow: 200000,
    maxOutputTokens: 100000,
  },
  {
    id: "openai/o4-mini-deep-research",
    modelName: "o4-mini-deep-research",
    name: "o4 Mini Deep Research",
    family: "o4",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 2, output: 8 },
    contextWindow: 200000,
    maxOutputTokens: 100000,
  },

  // OpenAI Legacy (Active)
  {
    id: "openai/gpt-4-turbo",
    modelName: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    family: "gpt-4",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 10, output: 30 },
    contextWindow: 128000,
    maxOutputTokens: 4096,
  },

  // ============================================
  // DEPRECATED OPENAI MODELS
  // ============================================

  // o-series (Deprecated)
  {
    id: "openai/o1",
    modelName: "o1",
    name: "o1",
    family: "o1",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 15, output: 60 },
    contextWindow: 200000,
    maxOutputTokens: 100000,
    deprecated: true,
  },
  {
    id: "openai/o1-mini",
    modelName: "o1-mini",
    name: "o1 Mini",
    family: "o1",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "reasoning"],
    pricing: { input: 1.1, output: 4.4 },
    contextWindow: 128000,
    maxOutputTokens: 65536,
    deprecated: true,
  },
  {
    id: "openai/o1-preview",
    modelName: "o1-preview",
    name: "o1 Preview",
    family: "o1",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "reasoning"],
    pricing: { input: 15, output: 60 },
    contextWindow: 128000,
    maxOutputTokens: 32768,
    deprecated: true,
  },

  // GPT-4 (Deprecated)
  {
    id: "openai/gpt-4",
    modelName: "gpt-4",
    name: "GPT-4",
    family: "gpt-4",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 30, output: 60 },
    contextWindow: 8192,
    maxOutputTokens: 8192,
    deprecated: true,
  },
  {
    id: "openai/gpt-4-0314",
    modelName: "gpt-4-0314",
    name: "GPT-4 (0314)",
    family: "gpt-4",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text"],
    pricing: { input: 30, output: 60 },
    contextWindow: 8192,
    maxOutputTokens: 8192,
    deprecated: true,
  },
  {
    id: "openai/gpt-4-1106-preview",
    modelName: "gpt-4-1106-preview",
    name: "GPT-4 Turbo Preview (1106)",
    family: "gpt-4",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 10, output: 30 },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    deprecated: true,
  },
  {
    id: "openai/gpt-4-0125-preview",
    modelName: "gpt-4-0125-preview",
    name: "GPT-4 Turbo Preview (0125)",
    family: "gpt-4",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 10, output: 30 },
    contextWindow: 128000,
    maxOutputTokens: 4096,
    deprecated: true,
  },
  {
    id: "openai/chatgpt-4o-latest",
    modelName: "chatgpt-4o-latest",
    name: "ChatGPT-4o Latest",
    family: "gpt-4o",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text", "vision"],
    pricing: { input: 5, output: 15 },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    deprecated: true,
  },

  // GPT-3.5 (Deprecated)
  {
    id: "openai/gpt-3.5-turbo",
    modelName: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    family: "gpt-3.5",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text"],
    pricing: { input: 0.5, output: 1.5 },
    contextWindow: 16385,
    maxOutputTokens: 4096,
    deprecated: true,
  },
  {
    id: "openai/gpt-3.5-turbo-1106",
    modelName: "gpt-3.5-turbo-1106",
    name: "GPT-3.5 Turbo (1106)",
    family: "gpt-3.5",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text"],
    pricing: { input: 1, output: 2 },
    contextWindow: 16385,
    maxOutputTokens: 4096,
    deprecated: true,
  },
  {
    id: "openai/gpt-3.5-turbo-instruct",
    modelName: "gpt-3.5-turbo-instruct",
    name: "GPT-3.5 Turbo Instruct",
    family: "gpt-3.5",
    provider: "openai",
    type: "chat",
    icon: OpenAI,
    capabilities: ["text"],
    pricing: { input: 1.5, output: 2 },
    contextWindow: 4096,
    maxOutputTokens: 4096,
    deprecated: true,
  },

  // ============================================
  // CHAT MODELS - XAI
  // ============================================

  // xAI Grok 4.1 Family (Latest - Multimodal)
  {
    id: "xai/grok-4-1-fast-reasoning",
    modelName: "grok-4-1-fast-reasoning",
    name: "Grok 4.1 Fast",
    family: "grok-4.1",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 0.2, output: 0.5 },
    contextWindow: 2000000,
    maxOutputTokens: 131072,
    primary: true,
  },
  {
    id: "xai/grok-4-1-fast-non-reasoning",
    modelName: "grok-4-1-fast-non-reasoning",
    name: "Grok 4.1 Fast (No Reasoning)",
    family: "grok-4.1",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text", "vision"],
    pricing: { input: 0.2, output: 0.5 },
    contextWindow: 2000000,
    maxOutputTokens: 131072,
  },

  // xAI Grok 4 Family (Multimodal)
  {
    id: "xai/grok-4-fast-reasoning",
    modelName: "grok-4-fast-reasoning",
    name: "Grok 4 Fast",
    family: "grok-4",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 0.2, output: 0.5 },
    contextWindow: 2000000,
    maxOutputTokens: 131072,
  },
  {
    id: "xai/grok-4-fast-non-reasoning",
    modelName: "grok-4-fast-non-reasoning",
    name: "Grok 4 Fast (No Reasoning)",
    family: "grok-4",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text", "vision"],
    pricing: { input: 0.2, output: 0.5 },
    contextWindow: 2000000,
    maxOutputTokens: 131072,
  },
  {
    id: "xai/grok-4-0709",
    modelName: "grok-4-0709",
    name: "Grok 4",
    family: "grok-4",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text", "vision", "reasoning"],
    pricing: { input: 3, output: 15 },
    contextWindow: 256000,
    maxOutputTokens: 131072,
  },

  // xAI Grok Code
  {
    id: "xai/grok-code-fast-1",
    modelName: "grok-code-fast-1",
    name: "Grok Code Fast",
    family: "grok-code",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text"],
    pricing: { input: 0.2, output: 1.5 },
    contextWindow: 256000,
    maxOutputTokens: 131072,
  },

  // xAI Grok 3 Family
  {
    id: "xai/grok-3",
    modelName: "grok-3",
    name: "Grok 3",
    family: "grok-3",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text"],
    pricing: { input: 3, output: 15 },
    contextWindow: 131072,
    maxOutputTokens: 131072,
  },
  {
    id: "xai/grok-3-mini",
    modelName: "grok-3-mini",
    name: "Grok 3 Mini",
    family: "grok-3",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text"],
    pricing: { input: 0.3, output: 0.5 },
    contextWindow: 131072,
    maxOutputTokens: 131072,
  },

  // xAI Grok 2 (Legacy)
  {
    id: "xai/grok-2-vision-1212",
    modelName: "grok-2-vision-1212",
    name: "Grok 2 Vision",
    family: "grok-2",
    provider: "xai",
    type: "chat",
    icon: Grok,
    capabilities: ["text", "vision"],
    pricing: { input: 2, output: 10 },
    contextWindow: 32768,
    maxOutputTokens: 32768,
  },

  // ============================================
  // IMAGE GENERATION MODELS
  // ============================================

  // OpenAI GPT Image (New)
  {
    id: "openai/gpt-image-1.5",
    modelName: "gpt-image-1.5",
    name: "GPT Image 1.5",
    family: "gpt-image",
    provider: "openai",
    type: "image-generation",
    icon: OpenAI,
    capabilities: ["image-generation"],
    pricing: { perImage: 0.08 },
    primary: true,
    imageGenConfig: {
      sizes: ["1024x1024", "1536x1024", "1024x1536", "auto"],
      defaultSize: "1024x1024",
      qualities: ["standard", "hd"],
    },
  },
  {
    id: "openai/gpt-image-1",
    modelName: "gpt-image-1",
    name: "GPT Image 1",
    family: "gpt-image",
    provider: "openai",
    type: "image-generation",
    icon: OpenAI,
    capabilities: ["image-generation"],
    pricing: { perImage: 0.04 },
    imageGenConfig: {
      sizes: ["1024x1024", "1536x1024", "1024x1536"],
      defaultSize: "1024x1024",
      qualities: ["standard", "hd"],
    },
  },
  {
    id: "openai/gpt-image-1-mini",
    modelName: "gpt-image-1-mini",
    name: "GPT Image 1 Mini",
    family: "gpt-image",
    provider: "openai",
    type: "image-generation",
    icon: OpenAI,
    capabilities: ["image-generation"],
    pricing: { perImage: 0.02 },
    imageGenConfig: {
      sizes: ["1024x1024", "512x512"],
      defaultSize: "1024x1024",
    },
  },
  {
    id: "openai/chatgpt-image-latest",
    modelName: "chatgpt-image-latest",
    name: "ChatGPT Image Latest",
    family: "chatgpt-image",
    provider: "openai",
    type: "image-generation",
    icon: OpenAI,
    capabilities: ["image-generation"],
    pricing: { perImage: 0.06 },
    imageGenConfig: {
      sizes: ["1024x1024", "1792x1024", "1024x1792"],
      defaultSize: "1024x1024",
    },
  },

  // OpenAI DALL-E (Legacy/Deprecated)
  {
    id: "openai/dall-e-3",
    modelName: "dall-e-3",
    name: "DALL-E 3",
    family: "dall-e",
    provider: "openai",
    type: "image-generation",
    icon: OpenAI,
    capabilities: ["image-generation"],
    pricing: { perImage: 0.04 },
    deprecated: true,
    imageGenConfig: {
      sizes: ["1024x1024", "1792x1024", "1024x1792"],
      defaultSize: "1024x1024",
      qualities: ["standard", "hd"],
    },
  },
  {
    id: "openai/dall-e-2",
    modelName: "dall-e-2",
    name: "DALL-E 2",
    family: "dall-e",
    provider: "openai",
    type: "image-generation",
    icon: OpenAI,
    capabilities: ["image-generation"],
    pricing: { perImage: 0.02 },
    deprecated: true,
    imageGenConfig: {
      sizes: ["256x256", "512x512", "1024x1024"],
      defaultSize: "512x512",
    },
  },

  // xAI Image Generation
  {
    id: "xai/grok-2-image-1212",
    modelName: "grok-2-image-1212",
    name: "Grok 2 Image",
    family: "grok-2",
    provider: "xai",
    type: "image-generation",
    icon: Grok,
    capabilities: ["image-generation"],
    pricing: { perImage: 0.07 },
    imageGenConfig: {
      sizes: ["1024x1024", "1024x768", "768x1024"],
      defaultSize: "1024x1024",
    },
  },
];

// ============================================
// TYPE HELPERS
// ============================================

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

export type ChatModelDefinition = ModelDefinition & { type: "chat" };
export type ImageGenModelDefinition = ModelDefinition & {
  type: "image-generation";
};

// ============================================
// FILTERED LISTS
// ============================================

export const CHAT_MODELS = AVAILABLE_MODELS.filter(
  (m): m is ChatModelDefinition => m.type === "chat",
);

export const IMAGE_GEN_MODELS = AVAILABLE_MODELS.filter(
  (m): m is ImageGenModelDefinition => m.type === "image-generation",
);

export const ACTIVE_MODELS = AVAILABLE_MODELS.filter((m) => !m.deprecated);
export const ACTIVE_CHAT_MODELS = CHAT_MODELS.filter((m) => !m.deprecated);
export const ACTIVE_IMAGE_GEN_MODELS = IMAGE_GEN_MODELS.filter(
  (m) => !m.deprecated,
);

export const PRIMARY_MODELS = AVAILABLE_MODELS.filter((m) => m.primary);
export const PRIMARY_CHAT_MODELS = CHAT_MODELS.filter((m) => m.primary);

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_MODEL_ID: ModelId = "openai/gpt-5";
export const DEFAULT_IMAGE_GEN_MODEL_ID: ModelId = "openai/gpt-image-1";
export const DEFAULT_IMAGE_MODEL_ID: ImageModelId = "gpt-image-1";

export const DEFAULT_PRICING: ModelPricing = { input: 2, output: 8 };

export const DEFAULT_ENABLED_MODEL_IDS: readonly ModelId[] =
  PRIMARY_CHAT_MODELS.map((m) => m.id as ModelId);

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getModelById(modelId: string): ModelDefinition | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

export function getChatModelById(
  modelId: string,
): ChatModelDefinition | undefined {
  return CHAT_MODELS.find((m) => m.id === modelId);
}

export function getImageGenModelById(
  modelId: string,
): ImageGenModelDefinition | undefined {
  return IMAGE_GEN_MODELS.find((m) => m.id === modelId);
}

export function getModelPricing(modelId: string): ModelPricing {
  const model = getModelById(modelId);
  return model?.pricing ?? DEFAULT_PRICING;
}

export function isValidModelId(modelId: string): modelId is ModelId {
  return AVAILABLE_MODELS.some((m) => m.id === modelId);
}

export function isValidChatModelId(modelId: string): boolean {
  return CHAT_MODELS.some((m) => m.id === modelId);
}

export function isValidImageGenModelId(modelId: string): boolean {
  return IMAGE_GEN_MODELS.some((m) => m.id === modelId);
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

export function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(tokens % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens % 1000 === 0 ? 0 : 1)}K`;
  }
  return tokens.toString();
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

// Keep IMAGE_MODELS for backward compatibility during migration
export type ImageModelId =
  | "gpt-image-1.5"
  | "gpt-image-1"
  | "gpt-image-1-mini"
  | "chatgpt-image-latest"
  | "dall-e-2"
  | "dall-e-3"
  | "grok-2-image-1212";

export type ImageModelDefinition = {
  id: ImageModelId;
  name: string;
  provider: ModelProvider;
  sizes: readonly string[];
  defaultSize: string;
};

export const IMAGE_MODELS: readonly ImageModelDefinition[] =
  IMAGE_GEN_MODELS.map((m) => ({
    id: m.modelName as ImageModelId,
    name: m.name,
    provider: m.provider,
    sizes: m.imageGenConfig?.sizes ?? [],
    defaultSize: m.imageGenConfig?.defaultSize ?? "",
  }));

export function getImageModelById(
  modelId: string,
): ImageModelDefinition | undefined {
  return IMAGE_MODELS.find((m) => m.id === modelId);
}
