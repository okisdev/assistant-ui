import { z } from "zod";

import { IMAGE_MODELS } from "@/lib/ai/models";

const imageModelIds = IMAGE_MODELS.map((m) => m.id) as [string, ...string[]];

export const generateImageSchema = z.object({
  prompt: z
    .string()
    .describe(
      "A detailed description of the image to generate. Be specific about style, colors, composition, and any important details.",
    ),
  model: z
    .enum(imageModelIds)
    .optional()
    .describe(
      "The image model to use. Defaults to the user's preferred model.",
    ),
});

export const generateImageTool = {
  description:
    "Generate an image based on a text description. Use this when the user asks you to create, generate, draw, or make an image, picture, illustration, or visual content. Always provide a detailed and descriptive prompt for better results.",
  inputSchema: generateImageSchema,
};
