# Demo Refactoring Opportunities

> Identifying demo code that could be simplified by using existing assistant-ui features.
>
> This document serves as:
> - 🔄 Refactoring guide for replacing custom code with package features
> - 📦 Discovery of underutilized assistant-ui capabilities
> - 🎯 Prioritized task list for code cleanup
> - 📖 Examples of how to use assistant-ui features properly

## Medium Effort

### 1. SuggestionAdapter for AI-Generated Follow-ups

**Current**: Static category-based suggestions only (Write, Learn, Create)
**Available**: `SuggestionAdapter` interface for dynamic AI-generated suggestions

```typescript
import { SuggestionAdapter } from "@assistant-ui/react";

const suggestionAdapter: SuggestionAdapter = {
  generate: async ({ messages }) => {
    const response = await fetch("/api/suggestions", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
    return response.json(); // [{ prompt: "..." }, ...]
  },
};

// In runtime setup
useLocalRuntime({
  adapters: {
    suggestion: suggestionAdapter,
  },
});
```

**Files to modify**: 
- `app/(app)/(chat)/provider.tsx`
- `components/assistant-ui/thread/composer-suggestions.tsx`

---

### 2. useAssistantInstructions Hook

**Current**: Manual system prompt building in `lib/ai/prompts.ts` and passing via API
**Available**: `useAssistantInstructions` hook for declarative client-side system prompt registration

```typescript
import { useAssistantInstructions } from "@assistant-ui/react";

// In a component
useAssistantInstructions(`
  You are a helpful assistant.
  User's name: ${userName}
  User's preferences: ${preferences}
`);
```

**Note**: This is for client-side context injection. Current server-side approach may be intentional for security.

**Files to consider**: `app/(app)/(chat)/provider.tsx`

---

### 3. ToolFallback Component

**Current**: No generic fallback for unknown tool calls
**Available**: `ToolFallback` component in registry

```typescript
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";

<MessagePrimitive.Parts
  components={{
    ToolCall: ToolFallback,
  }}
/>
```

**Files to modify**: `components/assistant-ui/thread/primitives.tsx`

---

### 4. ThreadFollowupSuggestions Component

**Current**: Custom `ComposerSuggestions` with static suggestions
**Available**: `ThreadFollowupSuggestions` in registry (displays `thread.suggestions`)

```typescript
import { ThreadFollowupSuggestions } from "@/components/assistant-ui/follow-up-suggestions";

// In thread component, after messages
<ThreadFollowupSuggestions />
```

**Files to modify**: `components/assistant-ui/thread/thread.tsx`

---

## Lower Priority

### 5. ThreadPrimitive.ViewportSlack

**Current**: Manual viewport padding with fixed values
**Available**: `ThreadPrimitive.ViewportSlack` for automatic viewport management

```typescript
<ThreadPrimitive.Viewport>
  <ThreadPrimitive.ViewportSlack minHeight={100} />
  <ThreadPrimitive.Messages />
</ThreadPrimitive.Viewport>
```

---

### 6. Speech Recognition Adapter Interface

**Current**: Custom `useSpeechRecognition` hook
**Available**: `SpeechRecognitionAdapter` type - could refactor to conform to interface

```typescript
// Current implementation could be wrapped to match:
type SpeechRecognitionAdapter = {
  listen: () => SpeechRecognitionAdapter.Session;
};
```

**Note**: Current implementation works well, this is mainly for consistency.

---

## Summary

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🟡 Medium | `SuggestionAdapter` | Medium | AI suggestions |
| 🟡 Medium | `ToolFallback` | Low | Better tool UI |
| 🟡 Medium | `ThreadFollowupSuggestions` | Low | Integrate suggestions |
| 🔵 Low | `useAssistantInstructions` | Medium | Architecture change |

**Removed from consideration:**
- `ToolGroup`: Demo's `ActivityProgress` serves a different purpose (progress indicators, not tool result UI)
- `ReasoningGroup`: Demo renders reasoning via `ReasoningContent`, custom grouping not needed
- `AttachmentPrimitive`: Demo already uses `Root`, `Remove`, `Name` primitives; custom `Thumb`, `StatusOverlay`, `FileAttachmentCard`, `PreviewDialog` are more feature-rich than built-in alternatives
- `ComposerPrimitive.If`: Deprecated API; demo's hook-based conditional rendering handles complex multi-state logic better

## Implementation Order

1. **Phase 1** (Feature additions):
   - Implement `SuggestionAdapter` for AI follow-ups
   - Add `ToolFallback` for unknown tools

2. **Phase 2** (Architecture evaluation):
   - Evaluate `useAssistantInstructions` usage for client-side context

