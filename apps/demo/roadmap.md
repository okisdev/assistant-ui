# Demo App Roadmap

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
