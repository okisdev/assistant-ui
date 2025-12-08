import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const apiKey = process.env["OPENAI_API_KEY"];

  // Check for API key
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "OPENAI_API_KEY not configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const stream = chat({
      adapter: openai(),
      model: "gpt-4o",
      messages,
      tools: [
        {
          name: "get_current_weather",
          description: "Get the current weather in a given location",
          inputSchema: z.object({
            city: z.string().describe("The city to get weather for"),
          }),
          execute: async ({ city }) => {
            // Simulated weather response
            return `The weather in ${city} is sunny with a temperature of 72°F`;
          },
        },
      ],
    });

    return toStreamResponse(stream);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
