import type { UserCapabilities } from "@/lib/database/schema";
import type { ResolvedUserCapabilities } from "@/lib/database/types";
import { DEFAULT_MODEL_ID, DEFAULT_ENABLED_MODEL_IDS } from "./models";

/**
 * Default values for user capabilities.
 * This is the single source of truth for all capability defaults.
 */
export const DEFAULT_CAPABILITIES: ResolvedUserCapabilities = {
  memory: {
    personalization: true,
    chatHistoryContext: false,
  },
  tools: {
    artifacts: true,
    webSearch: false,
  },
  model: {
    defaultId: DEFAULT_MODEL_ID,
    reasoningEnabled: true,
  },
  models: {
    enabledIds: [...DEFAULT_ENABLED_MODEL_IDS],
  },
  prompting: {
    chainOfThought: "off",
  },
};

/**
 * Resolve partial user capabilities to full resolved capabilities.
 * Applies default values for any missing fields.
 */
export function resolveCapabilities(
  partial: UserCapabilities | null | undefined,
): ResolvedUserCapabilities {
  const capabilities = partial ?? {};

  return {
    memory: {
      personalization:
        capabilities.memory?.personalization ??
        DEFAULT_CAPABILITIES.memory.personalization,
      chatHistoryContext:
        capabilities.memory?.chatHistoryContext ??
        DEFAULT_CAPABILITIES.memory.chatHistoryContext,
    },
    tools: {
      artifacts:
        capabilities.tools?.artifacts ?? DEFAULT_CAPABILITIES.tools.artifacts,
      webSearch:
        capabilities.tools?.webSearch ?? DEFAULT_CAPABILITIES.tools.webSearch,
    },
    model: {
      defaultId:
        capabilities.model?.defaultId ?? DEFAULT_CAPABILITIES.model.defaultId,
      reasoningEnabled:
        capabilities.model?.reasoningEnabled ??
        DEFAULT_CAPABILITIES.model.reasoningEnabled,
    },
    models: {
      enabledIds: capabilities.models?.enabledIds ?? [
        ...DEFAULT_CAPABILITIES.models.enabledIds,
      ],
    },
    prompting: {
      chainOfThought:
        capabilities.prompting?.chainOfThought ??
        DEFAULT_CAPABILITIES.prompting.chainOfThought,
    },
  };
}
