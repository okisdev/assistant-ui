# TanStack AI Example

This example demonstrates how to use `@assistant-ui/react` with [TanStack AI](https://github.com/tanstack/ai).

## Features

- TanStack AI integration via `@assistant-ui/react-tanstack-ai`
- Server-side chat API using `@tanstack/ai` and `@tanstack/ai-openai`
- Tool/function calling support
- Streaming responses
- Markdown rendering
- File attachments

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key

### Installation

```bash
pnpm install
```

### Environment Setup

Create a `.env.local` file with your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### Running the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # TanStack AI chat endpoint
│   ├── globals.css           # Tailwind CSS styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main chat page
├── components/
│   ├── assistant-ui/         # Chat UI components
│   │   ├── thread.tsx
│   │   ├── markdown-text.tsx
│   │   ├── attachment.tsx
│   │   ├── tool-fallback.tsx
│   │   └── tooltip-icon-button.tsx
│   └── ui/                   # Base UI components (shadcn/ui)
├── lib/
│   └── utils.ts              # Utility functions
└── package.json
```

## Key Differences from AI SDK v5 Example

| Aspect | AI SDK v5 | TanStack AI |
|--------|-----------|-------------|
| Runtime Hook | `useChatRuntime()` from `@assistant-ui/react-ai-sdk` | `useTanStackChatRuntime()` from `@assistant-ui/react-tanstack-ai` |
| Server API | `streamText()` from `ai` | `chat()` from `@tanstack/ai` |
| Provider | `@ai-sdk/openai` | `@tanstack/ai-openai` |
| Response | `toUIMessageStreamResponse()` | `toStreamResponse()` |

## Usage

### Client-side

```tsx
import { useTanStackChatRuntime } from "@assistant-ui/react-tanstack-ai";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

export default function Home() {
  const runtime = useTanStackChatRuntime({
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Your chat UI */}
    </AssistantRuntimeProvider>
  );
}
```

### Server-side

```ts
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY }),
    model: "gpt-4o",
    messages,
    tools: [
      // Define your tools here
    ],
  });

  return toStreamResponse(stream);
}
```

## Learn More

- [assistant-ui Documentation](https://www.assistant-ui.com/)
- [TanStack AI Documentation](https://github.com/tanstack/ai)
- [TanStack AI React Hooks](https://github.com/tanstack/ai/tree/main/packages/typescript/ai-react)


