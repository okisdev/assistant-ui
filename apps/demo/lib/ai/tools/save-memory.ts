import { z } from "zod";

export const saveMemorySchema = z.object({
  content: z.string().describe("The information to remember about the user"),
  category: z
    .string()
    .optional()
    .describe(
      "Optional category for the memory (e.g., 'preference', 'goal', 'personal')",
    ),
});

export const saveMemoryTool = {
  description:
    "Save important information about the user to remember for future conversations. Use this when the user shares personal details, preferences, goals, or any context worth remembering.",
  inputSchema: saveMemorySchema,
};
