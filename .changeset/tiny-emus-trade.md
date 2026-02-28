---
"@assistant-ui/react-ag-ui": patch
---

fix(react-ag-ui): correctly import `MESSAGES_SNAPSHOT` events that include `role: "tool"` messages by normalizing them into assistant tool-call results before core conversion.
