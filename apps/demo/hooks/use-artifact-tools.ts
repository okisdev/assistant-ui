"use client";

import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useAssistantApi } from "@assistant-ui/react";

type UseArtifactToolsOptions = {
  enabled?: boolean;
};

export const useArtifactTools = (options: UseArtifactToolsOptions = {}) => {
  const { enabled = true } = options;
  const api = useAssistantApi();

  const tool = useMemo(
    () => ({
      description:
        "Create an interactive artifact. Use this when the user asks you to build, create, or generate something visual like a website, app, game, calculator, or interactive component. The content should be a complete HTML document with embedded CSS and JavaScript.",
      parameters: z.object({
        title: z
          .string()
          .describe("A short, descriptive title for the artifact"),
        content: z
          .string()
          .describe(
            "The complete HTML content of the artifact, including embedded CSS and JavaScript. Should be a full HTML document.",
          ),
        type: z
          .enum(["html", "react", "svg"])
          .default("html")
          .describe("The type of artifact: html, react, or svg"),
      }),
      execute: async ({
        title,
        content,
        type,
      }: {
        title: string;
        content: string;
        type: "html" | "react" | "svg";
      }) => {
        return {
          success: true,
          title,
          content,
          type,
          message: `Created artifact: "${title}"`,
        };
      },
    }),
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    return api.modelContext().register({
      getModelContext: () => ({
        tools: {
          create_artifact: tool,
        },
      }),
    });
  }, [api, tool, enabled]);
};
