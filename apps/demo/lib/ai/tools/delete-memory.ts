import { z } from "zod";

export const deleteMemorySchema = z.object({
  id: z.string().describe("The ID of the memory to delete"),
});

export const deleteMemoryTool = {
  description:
    "Delete a memory that is no longer relevant, outdated, or when the user explicitly asks to forget something.",
  inputSchema: deleteMemorySchema,
};
