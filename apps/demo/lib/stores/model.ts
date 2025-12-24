import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
  ACTIVE_MODELS,
  DEFAULT_MODEL_ID,
  getModelById,
  isValidModelId,
  type ModelDefinition,
} from "@/lib/ai/models";

export const sessionModelAtom = atomWithStorage<string | null>(
  "aui:session-model",
  null,
);

export const chatModelAtom = atom<string | null>(null);

export const defaultModelAtom = atom<string>(DEFAULT_MODEL_ID);

export const enabledModelIdsAtom = atom<string[]>([]);

export const serverReasoningEnabledAtom = atom<boolean>(true);

export const optimisticReasoningEnabledAtom = atom<boolean | null>(null);

export const effectiveModelAtom = atom((get) => {
  const sessionModel = get(sessionModelAtom);
  const chatModel = get(chatModelAtom);
  const defaultModel = get(defaultModelAtom);

  if (sessionModel && isValidModelId(sessionModel)) {
    return sessionModel;
  }
  if (chatModel && isValidModelId(chatModel)) {
    return chatModel;
  }
  if (isValidModelId(defaultModel)) {
    return defaultModel;
  }
  return DEFAULT_MODEL_ID;
});

export const currentModelAtom = atom((get) => {
  const effectiveModel = get(effectiveModelAtom);
  return getModelById(effectiveModel) ?? getModelById(DEFAULT_MODEL_ID)!;
});

export const reasoningEnabledAtom = atom((get) => {
  const optimistic = get(optimisticReasoningEnabledAtom);
  const server = get(serverReasoningEnabledAtom);
  return optimistic ?? server;
});

export const effectiveReasoningEnabledAtom = atom((get) => {
  const currentModel = get(currentModelAtom);
  const reasoningEnabled = get(reasoningEnabledAtom);
  return currentModel.capabilities.includes("reasoning") && reasoningEnabled;
});

export const enabledModelsAtom = atom((get) => {
  const enabledIds = new Set(get(enabledModelIdsAtom));
  const effectiveModel = get(effectiveModelAtom);
  const currentModel = get(currentModelAtom);

  const models = ACTIVE_MODELS.filter((m) => enabledIds.has(m.id));

  if (currentModel && !enabledIds.has(effectiveModel)) {
    models.unshift(currentModel);
  }

  return models as ModelDefinition[];
});
