import { openai } from "@ai-sdk/openai";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
  JsonToSseTransformStream,
} from "ai";
import { after } from "next/server";
import {
  createResumableContext,
  type ResumableContext,
} from "assistant-stream/resumable";
import { createRedisPubSub } from "assistant-stream/resumable/redis";
import { z } from "zod";

export const maxDuration = 60;

let globalStreamContext: ResumableContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    globalStreamContext = createResumableContext({
      waitUntil: after,
      pubsub: createRedisPubSub(),
    });
  }
  return globalStreamContext;
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const streamId = crypto.randomUUID();

  const result = streamText({
    model: openai("gpt-4o"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    tools: {
      get_current_weather: tool({
        description: "Get the current weather for a city",
        inputSchema: z.object({
          city: z.string().describe("The city to get weather for"),
        }),
        execute: async ({ city }: { city: string }) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return `The weather in ${city} is sunny with a temperature of 72°F`;
        },
      }),
    },
  });

  const stream = result
    .toUIMessageStream()
    .pipeThrough(new JsonToSseTransformStream());

  const streamContext = getStreamContext();

  const resumableStream = await streamContext.resumableStream(
    streamId,
    () => stream,
  );

  if (resumableStream) {
    return streamContext.createResponse(streamId, resumableStream);
  }

  // Fallback if stream creation fails
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Stream-Id": streamId,
    },
  });
}
