import { z } from "zod";

export const updateMemorySchema = z.object({
  id: z.string().describe("The ID of the memory to update"),
  content: z.string().describe("The new content for the memory"),
  category: z
    .string()
    .optional()
    .describe(
      "Optional category for the memory (e.g., 'preference', 'goal', 'personal')",
    ),
});

export const updateMemoryTool = {
  description:
    "Update an existing memory when user information changes, preferences evolve, or previous information needs correction. Use this instead of save_memory when the new information supersedes existing memory.",
  inputSchema: updateMemorySchema,
};
