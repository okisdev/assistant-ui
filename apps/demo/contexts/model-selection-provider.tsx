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
import { useCapabilities } from "@/contexts/capabilities-provider";
import {
  ACTIVE_MODELS,
  DEFAULT_MODEL_ID,
  getModelById,
  isValidModelId,
  type ModelDefinition,
} from "@/lib/ai/models";
import { modelTransport } from "@/app/(app)/(chat)/provider";

type ModelSelectionContextValue = {
  modelId: string;
  model: ModelDefinition;
  setModel: (modelId: string) => void;
  persistModel: (modelId: string) => Promise<void>;
  isPersisting: boolean;
  userDefaultModel: string;
  chatModel: string | null;
  reasoningEnabled: boolean;
  setReasoningEnabled: (enabled: boolean) => void;
  /** Models that are enabled for the user */
  enabledModels: ModelDefinition[];
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

export function ModelSelectionProvider({ children }: { children: ReactNode }) {
  const assistantApi = useAssistantApi();
  const { capabilities, updateCapabilities } = useCapabilities();
  const utils = api.useUtils();

  const chatId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );

  const { data: chatData } = api.chat.get.useQuery(
    { id: chatId! },
    { enabled: !!chatId },
  );

  const [sessionModel, setSessionModel] = useState<string | null>(null);
  const [optimisticReasoningEnabled, setOptimisticReasoningEnabled] = useState<
    boolean | null
  >(null);

  const reasoningEnabled =
    optimisticReasoningEnabled ?? capabilities.model.reasoningEnabled;

  const setReasoningEnabled = useCallback(
    (enabled: boolean) => {
      setOptimisticReasoningEnabled(enabled);

      updateCapabilities({ model: { reasoningEnabled: enabled } }).finally(
        () => {
          setOptimisticReasoningEnabled(null);
        },
      );
    },
    [updateCapabilities],
  );

  const effectiveModel = useMemo(() => {
    if (sessionModel && isValidModelId(sessionModel)) {
      return sessionModel;
    }
    if (chatData?.model && isValidModelId(chatData.model)) {
      return chatData.model;
    }
    if (isValidModelId(capabilities.model.defaultId)) {
      return capabilities.model.defaultId;
    }
    return DEFAULT_MODEL_ID;
  }, [sessionModel, chatData?.model, capabilities.model.defaultId]);

  const currentModel = useMemo(
    () => getModelById(effectiveModel) ?? getModelById(DEFAULT_MODEL_ID)!,
    [effectiveModel],
  );

  const enabledModels = useMemo(() => {
    const enabledIds = new Set(capabilities.models.enabledIds);

    // Filter to only show enabled models
    const models = ACTIVE_MODELS.filter((m) => enabledIds.has(m.id));

    // Always include the current model if it exists (even if disabled)
    if (currentModel && !enabledIds.has(effectiveModel)) {
      models.unshift(currentModel);
    }

    return models;
  }, [capabilities.models.enabledIds, effectiveModel, currentModel]);

  const updateChatMutation = api.chat.update.useMutation({
    onSuccess: () => {
      if (chatId) {
        utils.chat.get.invalidate({ id: chatId });
      }
    },
  });

  const setModel = useCallback((modelId: string) => {
    if (isValidModelId(modelId)) {
      setSessionModel(modelId);
    }
  }, []);

  const persistModel = useCallback(
    async (modelId: string) => {
      if (!chatId || !isValidModelId(modelId)) return;
      await updateChatMutation.mutateAsync({
        id: chatId,
        model: modelId,
      });
      setSessionModel(null);
    },
    [chatId, updateChatMutation],
  );

  const effectiveReasoningEnabled = useMemo(() => {
    return currentModel.capabilities.includes("reasoning") && reasoningEnabled;
  }, [currentModel.capabilities, reasoningEnabled]);

  useEffect(() => {
    modelTransport.reasoningEnabled = effectiveReasoningEnabled;
  }, [effectiveReasoningEnabled]);

  useEffect(() => {
    return assistantApi.modelContext().register({
      getModelContext: () => ({
        config: {
          modelName: effectiveModel,
        },
      }),
    });
  }, [assistantApi, effectiveModel]);

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
      userDefaultModel: capabilities.model.defaultId,
      chatModel: chatData?.model ?? null,
      reasoningEnabled: effectiveReasoningEnabled,
      setReasoningEnabled,
      enabledModels,
    }),
    [
      effectiveModel,
      currentModel,
      setModel,
      persistModel,
      updateChatMutation.isPending,
      capabilities.model.defaultId,
      chatData?.model,
      effectiveReasoningEnabled,
      setReasoningEnabled,
      enabledModels,
    ],
  );

  return (
    <ModelSelectionContext.Provider value={value}>
      {children}
    </ModelSelectionContext.Provider>
  );
}
