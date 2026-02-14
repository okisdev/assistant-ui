import { createMCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const client = await createMCPClient({
    transport: {
      type: "http",
      url: process.env.MCP_SERVER_URL ?? "http://localhost:8080/mcp",
    },
  });

  try {
    const tools = await client.tools();

    const result = streamText({
      model: openai("gpt-4o"),
      tools,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse();
  } finally {
    await client.close();
  }
}
