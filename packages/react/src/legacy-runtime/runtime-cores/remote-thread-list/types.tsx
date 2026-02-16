export type {
  RemoteThreadInitializeResponse,
  RemoteThreadMetadata,
  RemoteThreadListResponse,
  RemoteThreadListAdapter,
} from "@assistant-ui/core";

import type { AssistantRuntime } from "../../runtime";
import type { RemoteThreadListAdapter } from "@assistant-ui/core";

export type RemoteThreadListOptions = {
  runtimeHook: () => AssistantRuntime;
  adapter: RemoteThreadListAdapter;

  /**
   * When true, if this runtime is used inside another RemoteThreadListRuntime,
   * it becomes a no-op and simply calls the runtimeHook directly.
   * This allows wrapping runtimes that internally use RemoteThreadListRuntime.
   */
  allowNesting?: boolean | undefined;
};
