# Demo App Roadmap

## Pending: @assistant-ui/react

### ThreadListItemPrimitive.Trigger Router Support

`ThreadListItemPrimitiveTrigger` is a button that only calls `switchTo()` in memory. It doesn't support `href` for URL navigation.

**Workaround**: Use `Link` + manual `switchTo()` call.

**Solution**: Add `onSwitchToThread` / `onSwitchToNewThread` callbacks to `RemoteThreadListAdapter`.

### ThreadListItemPrimitive Custom Actions Dropdown

Currently only `ThreadListItemPrimitive.Archive` is available. No support for custom dropdown menu (three dots menu) with additional actions like rename, delete, etc.

**Solution**: Add `ThreadListItemPrimitive.Actions` or similar component for custom dropdown menus.
