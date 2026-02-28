---
"@assistant-ui/react-langgraph": patch
---

fix(react-langgraph): treat stream cancellation `AbortError` as a normal exit condition in `useLangGraphMessages` to avoid unhandled promise rejections when runs are cancelled.
