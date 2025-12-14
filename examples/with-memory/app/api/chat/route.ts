import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = [
  {
    type: "function" as const,
    function: {
      name: "save_memory",
      description: `Save important information about the user for future conversations. 
Use this tool when the user shares:
- Their name or personal details
- Preferences (e.g., communication style, interests, hobbies)
- Goals or projects they're working on
- Important context about their situation
- Any information they explicitly ask you to remember`,
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The information to remember about the user",
          },
          category: {
            type: "string",
            description:
              "Optional category for the memory (e.g., 'preference', 'fact', 'goal', 'context')",
          },
        },
        required: ["content"],
      },
    },
  },
];

export async function POST(req: Request) {
  const { messages, system } = await req.json();

  const openaiMessages = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    ...messages,
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: openaiMessages,
    tools,
    tool_choice: "auto",
    stream: true,
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      const currentToolCalls: Array<{
        id: string;
        name: string;
        arguments: string;
      }> = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify({ type: "text", content: delta.content })}\n`,
            ),
          );
        }

        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index;

            if (!currentToolCalls[index]) {
              currentToolCalls[index] = {
                id: toolCall.id || "",
                name: toolCall.function?.name || "",
                arguments: "",
              };
            }

            if (toolCall.id) {
              currentToolCalls[index].id = toolCall.id;
            }
            if (toolCall.function?.name) {
              currentToolCalls[index].name = toolCall.function.name;
            }
            if (toolCall.function?.arguments) {
              currentToolCalls[index].arguments += toolCall.function.arguments;
            }
          }
        }

        if (chunk.choices[0]?.finish_reason === "tool_calls") {
          for (const toolCall of currentToolCalls) {
            if (toolCall.id && toolCall.name) {
              controller.enqueue(
                encoder.encode(
                  `${JSON.stringify({
                    type: "tool_call",
                    id: toolCall.id,
                    name: toolCall.name,
                    arguments: toolCall.arguments,
                  })}\n`,
                ),
              );
            }
          }
        }
      }

      controller.enqueue(
        encoder.encode(`${JSON.stringify({ type: "done" })}\n`),
      );
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
    },
  });
}
