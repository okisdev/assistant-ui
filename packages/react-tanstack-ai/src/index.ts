// Runtime hooks
export { useTanStackAIRuntime } from "./useTanStackAIRuntime";
export {
  useTanStackChatRuntime,
  fetchServerSentEvents,
} from "./useTanStackChatRuntime";

// Transport
export {
  TanStackChatTransport,
  createAssistantConnection,
  type ConnectionAdapter,
  type TanStackChatTransportOptions,
} from "./TanStackChatTransport";

// Message conversion utilities
export {
  TanStackMessageConverter,
  getTanStackMessages,
} from "./convertTanStackMessages";

// Types
export type {
  TanStackUIMessage,
  TanStackMessagePart,
  TanStackTextPart,
  TanStackThinkingPart,
  TanStackToolCallPart,
  TanStackToolResultPart,
  TanStackImagePart,
  TanStackAudioPart,
  TanStackVideoPart,
  TanStackDocumentPart,
  TanStackContentPartSource,
  TanStackToolCallState,
  TanStackToolResultState,
  TanStackChatHelpers,
  TanStackAIRuntimeOptions,
  TanStackChatRuntimeOptions,
} from "./types";

// Utility functions
export { toCreateMessage, toTanStackParts } from "./utils/toCreateMessage";
export { sliceMessagesUntil } from "./utils/sliceMessagesUntil";
