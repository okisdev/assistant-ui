"use client";

import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useAssistantApi } from "@assistant-ui/react";

const ARTIFACT_INSTRUCTIONS = `You have the ability to create interactive artifacts using the create_artifact tool.

When the user asks you to create, build, or generate something visual or interactive (like a website, app, calculator, game, chart, or any interactive component), use the create_artifact tool to generate it.

Guidelines for creating artifacts:
- Create complete, self-contained HTML documents with embedded CSS and JavaScript
- Use modern CSS features (flexbox, grid, CSS variables)
- Add interactivity with vanilla JavaScript when appropriate
- Make designs visually appealing with proper spacing, colors, and typography
- Ensure the artifact is responsive and works on different screen sizes
- Include all necessary styles inline or in a <style> tag
- For complex interactions, include all JavaScript in a <script> tag

Examples of what to create as artifacts:
- Landing pages and website mockups
- Interactive calculators and converters
- Data visualizations and charts
- Simple games (tic-tac-toe, memory game, etc.)
- Form layouts and UI components
- Countdown timers and clocks
- Todo lists and productivity tools`;

type UseArtifactToolsOptions = {
  enabled?: boolean;
};

/**
 * Hook that registers AI tools for artifact generation.
 * When enabled, AI can create interactive HTML artifacts.
 */
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
        system: ARTIFACT_INSTRUCTIONS,
        tools: {
          create_artifact: tool,
        },
      }),
    });
  }, [api, tool, enabled]);
};
