"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAssistantApi, useAssistantState } from "@assistant-ui/react";
import { api } from "@/utils/trpc/client";
import {
  DEFAULT_MODEL_ID,
  getModelById,
  isValidModelId,
  type ModelDefinition,
} from "@/lib/models";

type ModelSelectionContextValue = {
  /** Current effective model ID */
  modelId: string;
  /** Current model details */
  model: ModelDefinition;
  /** Set model for current session (not persisted) */
  setModel: (modelId: string) => void;
  /** Persist model selection to the chat */
  persistModel: (modelId: string) => Promise<void>;
  /** Whether the model is being persisted */
  isPersisting: boolean;
  /** User's default model from capabilities */
  userDefaultModel: string;
  /** Chat-specific model (if set) */
  chatModel: string | null;
};

const ModelSelectionContext = createContext<ModelSelectionContextValue | null>(
  null,
);

export function useModelSelection(): ModelSelectionContextValue {
  const ctx = useContext(ModelSelectionContext);
  if (!ctx) {
    throw new Error(
      "useModelSelection must be used within a ModelSelectionProvider",
    );
  }
  return ctx;
}

/**
 * Provider to manage model selection for the current chat session.
 *
 * Priority order for model selection:
 * 1. Session override (user changed model in current session)
 * 2. Chat-specific model (stored in database)
 * 3. User default model (from capabilities)
 * 4. Global default model
 */
export function ModelSelectionProvider({ children }: { children: ReactNode }) {
  const assistantApi = useAssistantApi();
  const { data: capabilities } = api.user.getCapabilities.useQuery();
  const utils = api.useUtils();

  // Get current chat ID from assistant state
  const chatId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );

  // Fetch chat data to get the chat-specific model
  const { data: chatData } = api.chat.get.useQuery(
    { id: chatId! },
    { enabled: !!chatId },
  );

  // Session-level model override (not persisted, only for current session)
  const [sessionModel, setSessionModel] = useState<string | null>(null);

  // Determine the effective model based on priority
  const effectiveModel = useMemo(() => {
    // 1. Session override takes highest priority
    if (sessionModel && isValidModelId(sessionModel)) {
      return sessionModel;
    }

    // 2. Chat-specific model
    if (chatData?.model && isValidModelId(chatData.model)) {
      return chatData.model;
    }

    // 3. User default model
    if (
      capabilities?.defaultModel &&
      isValidModelId(capabilities.defaultModel)
    ) {
      return capabilities.defaultModel;
    }

    // 4. Global default
    return DEFAULT_MODEL_ID;
  }, [sessionModel, chatData?.model, capabilities?.defaultModel]);

  // Get model details
  const currentModel = useMemo(
    () => getModelById(effectiveModel) ?? getModelById(DEFAULT_MODEL_ID)!,
    [effectiveModel],
  );

  // Update chat mutation for persisting model selection
  const updateChatMutation = api.chat.update.useMutation({
    onSuccess: () => {
      if (chatId) {
        utils.chat.get.invalidate({ id: chatId });
      }
    },
  });

  // Set model for current session only (doesn't persist)
  const setModel = useCallback((modelId: string) => {
    if (isValidModelId(modelId)) {
      setSessionModel(modelId);
    }
  }, []);

  // Persist model selection to the chat
  const persistModel = useCallback(
    async (modelId: string) => {
      if (!chatId || !isValidModelId(modelId)) return;

      await updateChatMutation.mutateAsync({
        id: chatId,
        model: modelId,
      });
      // Clear session override since it's now persisted
      setSessionModel(null);
    },
    [chatId, updateChatMutation],
  );

  // Register model context with assistant runtime
  // The model field will be included in the request body via config.modelName
  useEffect(() => {
    return assistantApi.modelContext().register({
      getModelContext: () => ({
        config: {
          modelName: effectiveModel,
        },
      }),
    });
  }, [assistantApi, effectiveModel]);

  // Reset session model when chat changes
  useEffect(() => {
    setSessionModel(null);
  }, [chatId]);

  const value = useMemo<ModelSelectionContextValue>(
    () => ({
      modelId: effectiveModel,
      model: currentModel,
      setModel,
      persistModel,
      isPersisting: updateChatMutation.isPending,
      userDefaultModel: capabilities?.defaultModel ?? DEFAULT_MODEL_ID,
      chatModel: chatData?.model ?? null,
    }),
    [
      effectiveModel,
      currentModel,
      setModel,
      persistModel,
      updateChatMutation.isPending,
      capabilities?.defaultModel,
      chatData?.model,
    ],
  );

  return (
    <ModelSelectionContext.Provider value={value}>
      {children}
    </ModelSelectionContext.Provider>
  );
}
