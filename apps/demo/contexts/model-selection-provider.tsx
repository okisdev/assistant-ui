"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useAssistantApi, useAssistantState } from "@assistant-ui/react";
import { api } from "@/utils/trpc/client";
import { useCapabilities } from "@/contexts/capabilities-provider";
import { isValidModelId, type ModelDefinition } from "@/lib/ai/models";
import { modelTransport } from "@/app/(app)/(chat)/provider";
import {
  sessionModelAtom,
  chatModelAtom,
  defaultModelAtom,
  enabledModelIdsAtom,
  serverReasoningEnabledAtom,
  optimisticReasoningEnabledAtom,
  effectiveModelAtom,
  currentModelAtom,
  effectiveReasoningEnabledAtom,
  enabledModelsAtom,
} from "@/lib/stores/model";

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

function ModelSelectionSync({
  chatModel,
  defaultModel,
  enabledIds,
  serverReasoningEnabled,
}: {
  chatModel: string | null;
  defaultModel: string;
  enabledIds: string[];
  serverReasoningEnabled: boolean;
}) {
  const setChatModel = useSetAtom(chatModelAtom);
  const setDefaultModel = useSetAtom(defaultModelAtom);
  const setEnabledIds = useSetAtom(enabledModelIdsAtom);
  const setServerReasoning = useSetAtom(serverReasoningEnabledAtom);

  useEffect(() => {
    setChatModel(chatModel);
  }, [chatModel, setChatModel]);

  useEffect(() => {
    setDefaultModel(defaultModel);
  }, [defaultModel, setDefaultModel]);

  useEffect(() => {
    setEnabledIds(enabledIds);
  }, [enabledIds, setEnabledIds]);

  useEffect(() => {
    setServerReasoning(serverReasoningEnabled);
  }, [serverReasoningEnabled, setServerReasoning]);

  return null;
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

  const setSessionModel = useSetAtom(sessionModelAtom);
  const setOptimisticReasoning = useSetAtom(optimisticReasoningEnabledAtom);

  const effectiveModel = useAtomValue(effectiveModelAtom);
  const currentModel = useAtomValue(currentModelAtom);
  const effectiveReasoningEnabled = useAtomValue(effectiveReasoningEnabledAtom);
  const enabledModels = useAtomValue(enabledModelsAtom);

  const setReasoningEnabled = useCallback(
    (enabled: boolean) => {
      setOptimisticReasoning(enabled);

      updateCapabilities({ model: { reasoningEnabled: enabled } }).finally(
        () => {
          setOptimisticReasoning(null);
        },
      );
    },
    [updateCapabilities, setOptimisticReasoning],
  );

  const updateChatMutation = api.chat.update.useMutation({
    onSuccess: () => {
      if (chatId) {
        utils.chat.get.invalidate({ id: chatId });
      }
    },
  });

  const setModel = useCallback(
    (modelId: string) => {
      if (isValidModelId(modelId)) {
        setSessionModel(modelId);
      }
    },
    [setSessionModel],
  );

  const persistModel = useCallback(
    async (modelId: string) => {
      if (!chatId || !isValidModelId(modelId)) return;
      await updateChatMutation.mutateAsync({
        id: chatId,
        model: modelId,
      });
      setSessionModel(null);
    },
    [chatId, updateChatMutation, setSessionModel],
  );

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
    if (chatData?.model && isValidModelId(chatData.model)) {
      setSessionModel(null);
    }
  }, [chatId, chatData?.model, setSessionModel]);

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
      <ModelSelectionSync
        chatModel={chatData?.model ?? null}
        defaultModel={capabilities.model.defaultId}
        enabledIds={capabilities.models.enabledIds}
        serverReasoningEnabled={capabilities.model.reasoningEnabled}
      />
      {children}
    </ModelSelectionContext.Provider>
  );
}
