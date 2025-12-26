# Demo App Enhancement Proposals

> Proposals for features that should be upstreamed to `@assistant-ui/react` and related packages.
>
> This document serves as:
> - 🐛 Bug reports and limitations in current assistant-ui packages
> - 💡 Feature proposals based on patterns discovered in demo implementation
> - 🔧 API design suggestions with code examples
> - 📊 Priority ranking for upstream contributions

## Pending: @assistant-ui/react

### ThreadListItemPrimitive.Trigger Router Support

`ThreadListItemPrimitiveTrigger` is a button that only calls `switchTo()` in memory. It doesn't support `href` for URL navigation.

**Workaround**: Use `Link` + manual `switchTo()` call.

**Solution**: Add `onSwitchToThread` / `onSwitchToNewThread` callbacks to `RemoteThreadListAdapter`.

### ThreadListItemPrimitive Custom Actions Dropdown

Currently only `ThreadListItemPrimitive.Archive` is available. No support for custom dropdown menu (three dots menu) with additional actions like rename, delete, etc.

**Solution**: Add `ThreadListItemPrimitive.Actions` or similar component for custom dropdown menus.

### Feedback (Upvote/Downvote) Persistence

When using `MessageFormatAdapter` (e.g., AI SDK v5 format) to load message history, `metadata.submittedFeedback` is lost because `MessageStorageEntry` doesn't include a `metadata` field.

**Root cause**:
1. `MessageStorageEntry` interface only has `{id, parent_id, format, content}` - no `metadata`
2. `ThreadHistoryAdapter` has no `update()` method to persist metadata changes after message is saved
3. `FeedbackAdapter` has no `load()` method to restore historical feedback state

**Workaround**: Use `useSyncFeedback` hook to fetch votes from database and call `submitFeedback()` after messages load.

**Solution** (any of these):
- Add `metadata` field to `MessageStorageEntry` interface
- Add `update()` method to `ThreadHistoryAdapter`
- Add `load()` method to `FeedbackAdapter`

### Attachment Persistence in AI SDK Format

When using `aiSDKV5FormatAdapter` to store messages, file attachments are explicitly filtered out and not persisted.

**Root cause** (`packages/react-ai-sdk/src/ui/adapters/aiSDKFormatAdapter.ts`):
```typescript
encode({ message: { id, parts, ...message } }) {
  // Filter out FileContentParts until they are supported
  return {
    ...message,
    parts: parts.filter((part) => part.type !== "file"),  // ← Attachments removed
  };
}
```

**Workaround**: Create a custom `MessageFormatAdapter` in the demo that preserves file parts.

**Solution**: Remove the filter in `aiSDKV5FormatAdapter.encode()` or add a configuration option to include file parts.

---

## Proposed: Memory System

No built-in support for persistent user memories that are automatically injected as system context.

**Demo Implementation**:
- `Memory` type: `{ id, content, category?, createdAt }`
- `MemoryStore` interface: `{ getMemories, addMemory, removeMemory, clearMemories, subscribe }`
- `DatabaseMemoryStore` class with optimistic updates
- `useAssistantMemory` hook for subscribing to memory state
- `useMemoryTools` hook for registering `save_memory` tool via `api.modelContext().register()`

**Proposed Solution** (`@assistant-ui/react`):
```typescript
// Types
export type Memory = {
  id: string;
  content: string;
  category?: string;
  createdAt: Date;
};

export type MemoryAdapter = {
  getMemories: () => Memory[];
  addMemory: (memory: Omit<Memory, "id" | "createdAt">) => Memory;
  removeMemory: (id: string) => void;
  clearMemories: () => void;
  subscribe: (callback: () => void) => () => void;
};

// Hooks
export function useAssistantMemory(adapter: MemoryAdapter): Memory[];
export function useMemoryTools(adapter: MemoryAdapter, options?: { enabled?: boolean }): void;
```

---

## Proposed: Speech Recognition Adapter

The package defines `SpeechRecognitionAdapter` type but provides no implementation.

**Demo Implementation**:
- `useSpeechRecognition` hook using Web Speech API
- Returns: `{ isSupported, isListening, interimTranscript, startListening, stopListening }`
- Supports language, continuous mode, interim results

**Proposed Solution** (`@assistant-ui/react`):
```typescript
// Built-in adapter
export class WebSpeechRecognitionAdapter implements SpeechRecognitionAdapter {
  constructor(options?: { language?: string; continuous?: boolean; interimResults?: boolean });
}

// Hook for easier usage
export function useSpeechRecognition(options?: {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string) => void;
}): {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
};
```

---

## Proposed: Message Timing/Metrics

No built-in support for tracking streaming latency metrics.

**Demo Implementation**:
- `useStreamingTiming` hook tracks: time to first chunk, time to first token, total stream time, tokens/sec, chunk count
- `MessageTiming` type with timing data
- `MessageTimingDisplay` component for hover tooltip

**Proposed Solution** (`@assistant-ui/react`):
```typescript
export type MessageTiming = {
  streamStartTime: number;
  timeToFirstChunk?: number;
  timeToFirstToken?: number;
  totalStreamTime?: number;
  tokensPerSecond?: number;
  totalChunks?: number;
};

// Option 1: Built into runtime
interface ThreadMessage {
  timing?: MessageTiming;
}

// Option 2: Separate hook
export function useMessageTiming(messageId: string): MessageTiming | undefined;

// Component primitive
export const MessagePrimitive.Timing: FC<{ children: (timing: MessageTiming) => ReactNode }>;
```

---

## Proposed: Incognito/Private Mode

No built-in support for temporary sessions that skip history persistence.

**Demo Implementation**:
- `IncognitoProvider` context with `isIncognito` state
- When incognito: skip `ThreadHistoryAdapter`, skip memory tools

**Proposed Solution** (`@assistant-ui/react`):
```typescript
// Runtime option
const runtime = useLocalRuntime({
  incognito: true, // Disables history adapter, memory, feedback persistence
});

// Or per-thread option
const threadOptions = {
  incognito: boolean;
};
```

---

## Proposed: Chain-of-Thought Parsing

No built-in support for parsing `<thinking>` tags in streamed text.

**Note**: This is different from the built-in `reasoning` message part type. The `reasoning` type is for model-native reasoning (like OpenAI's reasoning tokens). This proposal is for prompt-based CoT where models output `<thinking>...</thinking>` tags in regular text.

**Demo Implementation**:
- `parseChainOfThought(text)` returns `{ thinking, content, isThinkingComplete }`
- `hasChainOfThought(text)` boolean check
- `TextWithChainOfThought` component for rendering
- `ChainOfThoughtContent` collapsible display

**Proposed Solution** (`@assistant-ui/react-markdown`):
```typescript
// Utility functions for prompt-based CoT
export function parseChainOfThought(text: string): {
  thinking: string | null;
  content: string;
  isThinkingComplete: boolean;
};

export function hasChainOfThought(text: string): boolean;

// Preprocessing option for MarkdownTextPrimitive
<MarkdownTextPrimitive
  preprocess={parseAndStripChainOfThought}
  components={{
    ChainOfThought: ({ thinking, isComplete }) => <CollapsibleThinking ... />,
  }}
/>
```

---

## Proposed: Source/Citation Component

**Current state**: `SourceMessagePartProps` type exists; `MessagePrimitive.Parts` accepts `Source` component; but default implementation is `() => null`.

**Demo Implementation**:
- `SourceContent` component displays URL sources with favicon, title, link
- Handles `SourceMessagePartProps` with `url`, `title`, `sourceType`

**Proposed Solution**:
```typescript
// Add default Source component to registry (similar to how ToolFallback works)
// apps/registry/components/assistant-ui/source-content.tsx
export const SourceContent: FC<SourceMessagePartProps> = ({ url, title, sourceType }) => (
  <a href={url} target="_blank" rel="noopener noreferrer">
    <img src={`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`} />
    {title || url}
  </a>
);
```

**Note**: Type support already exists; proposal is for a ready-to-use default component in the registry.

---

## Proposed: Thread Soft Delete / Trash

No built-in support for thread lifecycle beyond archive.

**Demo Implementation**:
- Soft delete with `deletedAt` timestamp
- 30-day retention period
- Restore from trash
- Permanent delete
- Days remaining display

**Proposed Solution** (`@assistant-ui/react`):
```typescript
// Extend ThreadListAdapter
interface ThreadListAdapter {
  // Existing
  archive?: (threadId: string) => Promise<void>;
  
  // New
  softDelete?: (threadId: string) => Promise<void>;
  restore?: (threadId: string) => Promise<void>;
  permanentDelete?: (threadId: string) => Promise<void>;
  
  // New state
  deletedThreads?: ExternalStoreThreadData<"deleted">[];
}

// New primitive
export const ThreadListItemPrimitive.Delete: FC<ActionButtonProps>;
export const ThreadListItemPrimitive.Restore: FC<ActionButtonProps>;
export const ThreadListItemPrimitive.PermanentDelete: FC<ActionButtonProps>;
```

---

## Proposed: Composer Modes

No built-in support for different input modes (e.g., image generation mode).

**Demo Implementation**:
- `ComposerModeProvider` with `mode: "default" | "image-generation"`
- Changes placeholder, tool behavior, UI styling

**Proposed Solution** (`@assistant-ui/react`):
```typescript
// Composer context extension
interface ComposerState {
  mode: string; // "default" | "image-generation" | custom
}

// Mode-aware composer using AssistantIf
<ComposerPrimitive.Root>
  <AssistantIf condition={({ composer }) => composer.mode === "image-generation"}>
    {/* Image-specific UI */}
  </AssistantIf>
</ComposerPrimitive.Root>
```

**Note**: `ComposerPrimitive.If` is deprecated; use `AssistantIf` with condition function instead.

---

## Proposed: Usage/Token Tracking

No built-in support for tracking token usage and costs.

**Demo Implementation**:
- Usage recorded per request with `inputTokens`, `outputTokens`, `reasoningTokens`, `estimatedCost`
- Usage dashboard with charts, heatmap, model breakdown
- Per-message usage display

**Proposed Solution** (`@assistant-ui/react`):
```typescript
export type UsageData = {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
  estimatedCost?: number;
};

export type UsageAdapter = {
  record: (usage: UsageData & { messageId: string; modelId: string }) => void;
  getByMessage: (messageId: string) => UsageData | undefined;
  getByThread: (threadId: string) => UsageData[];
};

// Message-level access
interface ThreadMessage {
  usage?: UsageData;
}

// Hook
export function useMessageUsage(messageId: string): UsageData | undefined;
```

---

## Proposed: Activity Progress Indicators

No built-in components for showing tool/reasoning progress during streaming.

**Note**: `ToolGroup` and `ReasoningGroup` exist for grouping rendered parts, but they don't provide progress indicators (loading spinners, status text). Demo's `ActivityProgress` serves a different purpose.

**Demo Implementation**:
- `ActivityProgress` component shows: reasoning progress, web search progress, image generation progress, MCP tool progress
- Dynamic updates based on message parts with loading spinners and status text

**Proposed Solution** (`@assistant-ui/react`):
```typescript
// Hook to access streaming progress state
export function useMessageProgress(): {
  isReasoning: boolean;
  toolsInProgress: Array<{ toolName: string; toolCallId: string }>;
  toolsCompleted: Array<{ toolName: string; toolCallId: string; result: unknown }>;
};

// Or add progress info to existing groups
<MessagePrimitive.Parts
  components={{
    ToolGroup: ({ startIndex, endIndex, isStreaming, children }) => (
      <div>
        {isStreaming && <Spinner />}
        {children}
      </div>
    ),
  }}
/>
```

---

## Summary: Upstream Priority

### High Priority (Core UX)
1. **Feedback Persistence** - Critical for production apps
2. **Attachment Persistence** - Files should not be lost
3. **Memory System** - Common pattern for personalization
4. **Speech Recognition** - Type exists, needs implementation

### Medium Priority (Nice to Have)
5. **Message Timing** - Useful for debugging/UX
6. **Incognito Mode** - Privacy feature
7. **Thread Soft Delete** - Better UX than hard delete
8. **Source/Citation Component** - Web search is common

### Lower Priority (App-Specific)
9. **Chain-of-Thought Parsing** - Can vary by model
10. **Composer Modes** - Highly app-specific
11. **Usage Tracking** - Often backend-specific
12. **Activity Progress** - UI preference
