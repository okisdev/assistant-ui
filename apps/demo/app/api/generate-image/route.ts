import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import {
  DEFAULT_IMAGE_MODEL_ID,
  getImageModelById,
  type ImageModelId,
} from "@/lib/ai/models";
import { api } from "@/utils/trpc/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api/auth";

export const maxDuration = 60;

type GenerateImageRequest = {
  prompt: string;
  model?: ImageModelId;
  chatId?: string | null;
};

function getImageModel(modelId: ImageModelId) {
  const modelDef = getImageModelById(modelId);
  if (!modelDef) {
    return openai.image("dall-e-2");
  }

  switch (modelDef.provider) {
    case "openai":
      return openai.image(modelId);
    case "xai":
      return xai.image(modelId);
    default:
      return openai.image("dall-e-2");
  }
}

async function resolveImageModel(
  requestModel: ImageModelId | undefined,
): Promise<ImageModelId> {
  if (requestModel) {
    return requestModel;
  }

  try {
    const capabilities = await api.user.capability.list();
    const defaultModel = capabilities.tools.defaultImageModel;
    if (defaultModel && getImageModelById(defaultModel as ImageModelId)) {
      return defaultModel as ImageModelId;
    }
  } catch {
    // Use default if not authenticated
  }

  return DEFAULT_IMAGE_MODEL_ID;
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const {
      prompt,
      model: requestModel,
      chatId,
    }: GenerateImageRequest = await req.json();

    const modelId = await resolveImageModel(requestModel);

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Invalid prompt provided" },
        { status: 400 },
      );
    }

    const modelDef = getImageModelById(modelId);
    const model = getImageModel(modelId);
    const size = modelDef?.defaultSize;

    const generateOptions: Parameters<typeof generateImage>[0] = {
      model,
      prompt,
    };

    // Only add size for OpenAI models (xAI doesn't support size parameter)
    if (modelDef?.provider === "openai" && size) {
      generateOptions.size = size as `${number}x${number}`;
    }

    const { image } = await generateImage(generateOptions);

    const id = nanoid();
    const filename = `generated-${id}.png`;
    const imageBuffer = Buffer.from(image.uint8Array);
    const blob = await put(filename, imageBuffer, {
      access: "public",
      contentType: "image/png",
    });

    await api.attachment.create({
      id,
      chatId: chatId || null,
      url: blob.url,
      pathname: blob.pathname,
      contentType: "image/png",
      size: imageBuffer.length,
      source: "generated",
      generationMetadata: {
        prompt,
        model: modelId,
        type: "image",
      },
    });

    return Response.json({
      id,
      url: blob.url,
      prompt,
      model: modelId,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate image";

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
