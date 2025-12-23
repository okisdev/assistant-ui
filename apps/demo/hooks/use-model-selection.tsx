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
  const { data: capabilities } = api.user.getCapabilities.useQuery();
  const utils = api.useUtils();

  const chatId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );

  const { data: chatData } = api.chat.get.useQuery(
    { id: chatId! },
    { enabled: !!chatId },
  );

  const [sessionModel, setSessionModel] = useState<string | null>(null);
  const [reasoningEnabled, setReasoningEnabled] = useState(true);

  const effectiveModel = useMemo(() => {
    if (sessionModel && isValidModelId(sessionModel)) {
      return sessionModel;
    }
    if (chatData?.model && isValidModelId(chatData.model)) {
      return chatData.model;
    }
    if (
      capabilities?.defaultModel &&
      isValidModelId(capabilities.defaultModel)
    ) {
      return capabilities.defaultModel;
    }
    return DEFAULT_MODEL_ID;
  }, [sessionModel, chatData?.model, capabilities?.defaultModel]);

  const currentModel = useMemo(
    () => getModelById(effectiveModel) ?? getModelById(DEFAULT_MODEL_ID)!,
    [effectiveModel],
  );

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
      userDefaultModel: capabilities?.defaultModel ?? DEFAULT_MODEL_ID,
      chatModel: chatData?.model ?? null,
      reasoningEnabled: effectiveReasoningEnabled,
      setReasoningEnabled,
    }),
    [
      effectiveModel,
      currentModel,
      setModel,
      persistModel,
      updateChatMutation.isPending,
      capabilities?.defaultModel,
      chatData?.model,
      effectiveReasoningEnabled,
    ],
  );

  return (
    <ModelSelectionContext.Provider value={value}>
      {children}
    </ModelSelectionContext.Provider>
  );
}
