"use client";

import { useEffect, useMemo } from "react";
import { useAssistantApi } from "@assistant-ui/react";
import {
  generateImageTool,
  generateImageSchema,
} from "@/lib/ai/tools/generate-image";
import type { ImageModelId } from "@/lib/ai/models";

type UseImageToolsOptions = {
  enabled?: boolean;
};

type GenerateImageResult = {
  url: string;
  prompt: string;
  model: ImageModelId;
};

export const useImageTools = (options: UseImageToolsOptions = {}) => {
  const { enabled = true } = options;
  const api = useAssistantApi();

  const tool = useMemo(
    () => ({
      description: generateImageTool.description,
      parameters: generateImageSchema,
      execute: async ({
        prompt,
        model,
      }: {
        prompt: string;
        model?: ImageModelId;
      }): Promise<GenerateImageResult> => {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, model }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate image");
        }

        const result: GenerateImageResult = await response.json();
        return result;
      },
    }),
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    return api.modelContext().register({
      getModelContext: () => ({
        tools: {
          generate_image: tool,
        },
      }),
    });
  }, [api, tool, enabled]);
};
