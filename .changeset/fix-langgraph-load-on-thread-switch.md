---
"@assistant-ui/react-langgraph": patch
---

fix: load function not called when switching threads

When using `AssistantCloud` + `useLangGraphRuntime`, the `load` function was never called when switching threads because the effect dependencies were all stable references. Now uses `useAuiState` to reactively track `externalId` changes.

Also adds:
- Cancellation logic to prevent race conditions
- Error handling for failed loads
- Clears messages before loading new thread
