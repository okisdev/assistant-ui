"use client";

import { useCallback, useEffect, type FC } from "react";
import {
  ComposerPrimitive,
  useAssistantApi,
  useAssistantState,
} from "@assistant-ui/react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useComposerState } from "@/contexts/composer-state-provider";
import { modelTransport } from "@/app/(app)/(chat)/provider";
import { ComposerHeader } from "./composer-header";
import { ComposerInput } from "./composer-input";
import { ComposerFooter } from "./composer-footer";
import { ComposerSuggestions } from "./composer-suggestions";

type ComposerProps = {
  placeholder?: string;
};

export const Composer: FC<ComposerProps> = ({
  placeholder = "Ask anything...",
}) => {
  const api = useAssistantApi();
  const { mode, resetMode } = useComposerState();
  const isImageGenerationMode = mode === "image-generation";
  const hasUploadingAttachments = useAssistantState(({ composer }) =>
    composer.attachments.some((a) => a.status.type === "running"),
  );

  useEffect(() => {
    modelTransport.composerMode = mode;
  }, [mode]);

  useEffect(() => {
    modelTransport.setOnComposerModeReset(() => {
      resetMode();
    });
    return () => {
      modelTransport.setOnComposerModeReset(null);
    };
  }, [resetMode]);

  const handleSpeechResult = useCallback(
    (transcript: string) => {
      const currentText = api.composer().getState().text;
      const newText = currentText.trim()
        ? `${currentText} ${transcript}`
        : transcript;
      api.composer().setText(newText);
    },
    [api],
  );

  const {
    isSupported: isSpeechSupported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
  });

  const displayPlaceholder = isListening
    ? interimTranscript || "Listening..."
    : isImageGenerationMode
      ? "Describe the image you want to generate..."
      : placeholder;

  return (
    <div className="flex w-full flex-col gap-3">
      <ComposerPrimitive.Root className="group/composer w-full rounded-2xl bg-muted/50 px-4 py-4">
        <ComposerHeader />
        <ComposerInput
          placeholder={displayPlaceholder}
          isListening={isListening}
          isSpeechSupported={isSpeechSupported}
          hasUploadingAttachments={hasUploadingAttachments}
          startListening={startListening}
          stopListening={stopListening}
        />
        <ComposerFooter />
      </ComposerPrimitive.Root>
      <ComposerSuggestions />
    </div>
  );
};
