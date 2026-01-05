export { useAISDKRuntime } from "./use-chat/useAISDKRuntime";
export { useChatRuntime } from "./use-chat/useChatRuntime";
export type { UseChatRuntimeOptions } from "./use-chat/useChatRuntime";
export { AssistantChatTransport } from "./use-chat/AssistantChatTransport";

// Resumable stream support
export {
  useResumableChatRuntime,
  type UseResumableChatRuntimeOptions,
} from "./use-chat/useResumableChatRuntime";
export {
  ResumableChatTransport,
  type ResumableChatTransportOptions,
} from "./use-chat/ResumableChatTransport";

// Re-export from @assistant-ui/react/resumable for convenience
export {
  ResumableStateManager,
  parseSSEStreamToText,
  parseSSEStreamToChunks,
} from "./use-chat/ResumableStateManager";

// AI SDK-specific helpers
export { createRestoredMessages } from "./use-chat/ResumableStateManager";
