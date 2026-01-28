import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a helpful LaTeX assistant. You help users write and edit LaTeX documents.

When providing LaTeX code:
- Use proper LaTeX syntax
- Explain what each part does
- Suggest best practices
- Use code blocks with \`\`\`latex for LaTeX code

You have access to the user's current document which is provided in the context.

When the user asks you to help with their document:
- Reference specific parts of their document
- Suggest improvements and fixes
- Provide complete code snippets they can use

Common tasks you help with:
- Writing mathematical equations
- Document structure (sections, chapters)
- Tables and figures
- Bibliography and citations
- Formatting and styling
- Package recommendations
- Debugging LaTeX errors`;

export async function POST(req: Request) {
  const { messages, system }: { messages: UIMessage[]; system?: string } =
    await req.json();

  const fullSystemPrompt = system
    ? `${SYSTEM_PROMPT}\n\n${system}`
    : SYSTEM_PROMPT;

  const result = streamText({
    model: openai("gpt-4o"),
    system: fullSystemPrompt,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
