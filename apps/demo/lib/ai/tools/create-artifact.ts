import { z } from "zod";

export const createArtifactSchema = z.object({
  title: z.string().describe("A short, descriptive title for the artifact"),
  content: z
    .string()
    .describe(
      "The complete HTML content of the artifact, including embedded CSS and JavaScript. Should be a full HTML document.",
    ),
  type: z
    .enum(["html", "react", "svg"])
    .default("html")
    .describe("The type of artifact: html, react, or svg"),
});

export const createArtifactTool = {
  description:
    "Create an interactive artifact. Use this when the user asks you to build, create, or generate something visual like a website, app, game, calculator, or interactive component. The content should be a complete HTML document with embedded CSS and JavaScript.",
  inputSchema: createArtifactSchema,
};
