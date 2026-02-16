import type { CoreAssistantToolProps } from "../AssistantToolPropsTypes";
import type { AssistantInstructionsConfig } from "../AssistantToolPropsTypes";

export interface ModelContextRegistryToolHandle<
  TArgs extends Record<string, unknown> = any,
  TResult = any,
> {
  update(tool: CoreAssistantToolProps<TArgs, TResult>): void;
  remove(): void;
}

export interface ModelContextRegistryInstructionHandle {
  update(config: string | AssistantInstructionsConfig): void;
  remove(): void;
}

export interface ModelContextRegistryProviderHandle {
  remove(): void;
}
