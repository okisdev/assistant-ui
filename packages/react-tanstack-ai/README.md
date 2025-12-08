# `@assistant-ui/react-tanstack-ai`

TanStack AI integration for `@assistant-ui/react`.

## Features

- Seamless integration with TanStack AI's `useChat` hook
- Automatic system message and frontend tools forwarding
- Support for tool approval workflows
- Type-safe message handling

## Installation

```bash
npm install @assistant-ui/react-tanstack-ai @tanstack/ai-react @tanstack/ai-client
```

## Usage

### Basic Setup

```typescript
import { useTanStackChatRuntime } from '@assistant-ui/react-tanstack-ai';
import { AssistantRuntimeProvider } from '@assistant-ui/react';

function App() {
  const runtime = useTanStackChatRuntime({
    api: '/api/chat',
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Your assistant-ui components */}
    </AssistantRuntimeProvider>
  );
}
```

### Using with TanStack AI's useChat directly

If you need more control over the chat configuration:

```typescript
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react';
import { useTanStackAIRuntime } from '@assistant-ui/react-tanstack-ai';
import { AssistantRuntimeProvider } from '@assistant-ui/react';

function App() {
  const chat = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  });

  const runtime = useTanStackAIRuntime(chat);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Your assistant-ui components */}
    </AssistantRuntimeProvider>
  );
}
```

### With Tools

```typescript
import { useTanStackChatRuntime } from '@assistant-ui/react-tanstack-ai';
import { toolDefinition } from '@tanstack/ai';
import { z } from 'zod';

const weatherTool = toolDefinition({
  name: 'get_weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string(),
  }),
});

function App() {
  const runtime = useTanStackChatRuntime({
    api: '/api/chat',
    tools: [weatherTool.client()],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Your assistant-ui components */}
    </AssistantRuntimeProvider>
  );
}
```

## API Reference

### `useTanStackChatRuntime(options)`

High-level hook that creates a runtime with TanStack AI's `useChat` internally.

**Options:**
- `api` - API endpoint URL (default: '/api/chat')
- `connection` - Custom ConnectionAdapter
- `tools` - Array of client tools
- `initialMessages` - Initial messages array
- `cloud` - AssistantCloud instance for thread management
- `adapters` - Custom adapters (attachments, speech, feedback)

### `useTanStackAIRuntime(chatHelpers, options?)`

Lower-level hook for when you need direct control over TanStack AI's `useChat`.

**Parameters:**
- `chatHelpers` - Return value from TanStack AI's `useChat` hook
- `options.adapters` - Custom adapters

## License

MIT


