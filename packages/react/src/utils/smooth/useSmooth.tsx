"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAssistantState } from "../../context";
import {
  MessagePartStatus,
  ReasoningMessagePart,
  TextMessagePart,
} from "../../types/AssistantTypes";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { useSmoothStatusStore } from "./SmoothContext";
import { writableStore } from "../../context/ReadonlyStore";
import { MessagePartState } from "../../legacy-runtime/runtime/MessagePartRuntime";

class TextStreamAnimator {
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = Date.now();
  private lastRenderTime: number = Date.now();
  public pendingText: string = "";

  // Batch update settings
  private minRenderInterval: number = 150; // ms between renders
  private minBatchSize: number = 15; // minimum chars to accumulate

  public targetText: string = "";

  constructor(
    public currentText: string,
    private setText: (newText: string) => void,
  ) {
    this.pendingText = currentText;
  }

  start() {
    if (this.animationFrameId !== null) return;
    this.lastUpdateTime = Date.now();
    this.animate();
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Flush any pending text on stop
    if (this.pendingText !== this.currentText) {
      this.currentText = this.pendingText;
      this.setText(this.currentText);
    }
  }

  private animate = () => {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    let timeToConsume = deltaTime;

    const remainingChars = this.targetText.length - this.pendingText.length;
    const baseTimePerChar = Math.min(5, 250 / remainingChars);

    let charsToAdd = 0;
    while (timeToConsume >= baseTimePerChar && charsToAdd < remainingChars) {
      charsToAdd++;
      timeToConsume -= baseTimePerChar;
    }

    if (charsToAdd !== remainingChars) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.animationFrameId = null;
    }
    if (charsToAdd === 0) return;

    this.pendingText = this.targetText.slice(
      0,
      this.pendingText.length + charsToAdd,
    );
    this.lastUpdateTime = currentTime - timeToConsume;

    // Batch update: only render if enough time passed or enough chars accumulated
    const timeSinceLastRender = currentTime - this.lastRenderTime;
    const pendingChars = this.pendingText.length - this.currentText.length;
    const isComplete = this.pendingText === this.targetText;

    if (
      isComplete ||
      timeSinceLastRender >= this.minRenderInterval ||
      pendingChars >= this.minBatchSize
    ) {
      this.currentText = this.pendingText;
      this.lastRenderTime = currentTime;
      this.setText(this.currentText);
    }
  };
}

const SMOOTH_STATUS: MessagePartStatus = Object.freeze({
  type: "running",
});

export const useSmooth = (
  state: MessagePartState & (TextMessagePart | ReasoningMessagePart),
  smooth: boolean = false,
): MessagePartState & (TextMessagePart | ReasoningMessagePart) => {
  const { text } = state;
  const id = useAssistantState(({ message }) => message.id);

  const idRef = useRef(id);
  const [displayedText, setDisplayedText] = useState(text);

  const smoothStatusStore = useSmoothStatusStore({ optional: true });
  const setText = useCallbackRef((text: string) => {
    setDisplayedText(text);
    if (smoothStatusStore) {
      const target =
        displayedText !== text || state.status.type === "running"
          ? SMOOTH_STATUS
          : state.status;
      writableStore(smoothStatusStore).setState(target, true);
    }
  });

  // TODO this is hacky
  useEffect(() => {
    if (smoothStatusStore) {
      const target =
        smooth && (displayedText !== text || state.status.type === "running")
          ? SMOOTH_STATUS
          : state.status;
      writableStore(smoothStatusStore).setState(target, true);
    }
  }, [smoothStatusStore, smooth, text, displayedText, state.status]);

  const [animatorRef] = useState<TextStreamAnimator>(
    new TextStreamAnimator(text, setText),
  );

  useEffect(() => {
    if (!smooth) {
      animatorRef.stop();
      return;
    }

    if (idRef.current !== id || !text.startsWith(animatorRef.targetText)) {
      idRef.current = id;
      setText(text);

      animatorRef.currentText = text;
      animatorRef.targetText = text;
      animatorRef.pendingText = text;
      animatorRef.stop();

      return;
    }

    animatorRef.targetText = text;
    animatorRef.start();
  }, [setText, animatorRef, id, smooth, text]);

  useEffect(() => {
    return () => {
      animatorRef.stop();
    };
  }, [animatorRef]);

  return useMemo(
    () =>
      smooth
        ? {
            type: "text",
            text: displayedText,
            status: text === displayedText ? state.status : SMOOTH_STATUS,
          }
        : state,
    [smooth, displayedText, state, text],
  );
};
