"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { UIMessage } from "@ai-sdk/react";
import type { MessageTiming, MessageUsage } from "@/types/message";

const MAX_RETAINED_TIMINGS = 100;

const CJK_REGEX = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;

function estimateTokens(text: string): number {
  const cjkMatches = text.match(CJK_REGEX);
  const cjkCount = cjkMatches?.length ?? 0;
  const nonCjkCount = text.length - cjkCount;

  return Math.ceil(cjkCount / 1.5) + Math.ceil(nonCjkCount / 4);
}

type MessageTimingTracker = {
  streamStartTime: number;
  lastChunkTime: number;
  firstChunkTime?: number;
  firstTokenTime?: number;
  endTime?: number;
  chunkCount: number;
  largestChunkGap: number;
  lastContentSnapshot: string;
};

function getContentSnapshot(message: UIMessage | undefined): string {
  if (!message?.parts) return "";
  return message.parts
    .map((part) => {
      if (part.type === "text") return `text:${part.text}`;
      if (part.type === "reasoning") return `reasoning:${part.text}`;
      if (part.type.startsWith("tool-")) {
        return `tool:${(part as { toolCallId?: string }).toolCallId}:${(part as { state?: string }).state}`;
      }
      return "";
    })
    .join("|");
}

function findLastAssistantMessage(
  messages: UIMessage[],
): UIMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.role === "assistant") {
      return messages[i];
    }
  }
  return undefined;
}

function createTracker(streamStartTime: number): MessageTimingTracker {
  return {
    streamStartTime,
    lastChunkTime: streamStartTime,
    chunkCount: 0,
    largestChunkGap: 0,
    lastContentSnapshot: "",
  };
}

function recordChunk(tracker: MessageTimingTracker): void {
  const now = Date.now();
  tracker.chunkCount++;

  const gap = now - tracker.lastChunkTime;
  if (gap > tracker.largestChunkGap) {
    tracker.largestChunkGap = gap;
  }
  tracker.lastChunkTime = now;

  if (tracker.firstChunkTime === undefined) {
    tracker.firstChunkTime = now - tracker.streamStartTime;
  }
}

function recordFirstToken(tracker: MessageTimingTracker): void {
  if (tracker.firstTokenTime === undefined) {
    tracker.firstTokenTime = Date.now() - tracker.streamStartTime;
  }
}

function calculateEstimatedTokens(message: UIMessage): number {
  let tokenCount = 0;
  if (message.parts) {
    for (const part of message.parts) {
      if (part.type === "text") {
        tokenCount += estimateTokens(part.text);
      } else if (part.type === "reasoning") {
        const text = (part as { text?: string }).text ?? "";
        tokenCount += estimateTokens(text);
      } else if (part.type === "tool-call") {
        const argsText = (part as { argsText?: string }).argsText ?? "";
        tokenCount += estimateTokens(argsText);
      }
    }
  }
  return tokenCount;
}

function getUsageFromMessage(message: UIMessage): MessageUsage | undefined {
  const metadata = message.metadata as
    | { usage?: MessageUsage }
    | null
    | undefined;
  return metadata?.usage;
}

function calculateTiming(
  tracker: MessageTimingTracker,
  message: UIMessage,
): MessageTiming {
  const { streamStartTime, firstChunkTime, firstTokenTime, endTime } = tracker;

  const totalStreamTime = endTime ? endTime - streamStartTime : null;
  const estimatedTokenCount = calculateEstimatedTokens(message);
  const usage = getUsageFromMessage(message);

  const outputTokens = usage?.outputTokens ?? estimatedTokenCount;
  const tokensPerSecond =
    totalStreamTime && outputTokens > 0
      ? (outputTokens / totalStreamTime) * 1000
      : null;

  const totalChunks = tracker.chunkCount > 0 ? tracker.chunkCount : null;
  const largestChunkGap =
    tracker.largestChunkGap > 0 ? tracker.largestChunkGap : null;

  const timing: MessageTiming = {
    streamStartTime,
    ...(firstChunkTime !== undefined && { timeToFirstChunk: firstChunkTime }),
    ...(firstTokenTime !== undefined && { timeToFirstToken: firstTokenTime }),
    ...(totalStreamTime !== null && { totalStreamTime }),
    ...(totalChunks !== null && { totalChunks }),
    ...(estimatedTokenCount > 0 && { estimatedTokens: estimatedTokenCount }),
    ...(tokensPerSecond !== null && { tokensPerSecond }),
    ...(largestChunkGap !== null && { largestChunkGap }),
    ...(usage && { usage }),
  };

  return timing;
}

export function useStreamingTiming(
  messages: UIMessage[],
  isRunning: boolean,
): Record<string, MessageTiming> {
  const trackersRef = useRef<Record<string, MessageTimingTracker>>({});
  const prevIsRunningRef = useRef<boolean>(false);
  const pendingStreamStartRef = useRef<number | null>(null);
  const [timings, setTimings] = useState<Record<string, MessageTiming>>({});

  const addTiming = useCallback((messageId: string, timing: MessageTiming) => {
    setTimings((prev) => {
      const newTimings = { ...prev, [messageId]: timing };
      const keys = Object.keys(newTimings);

      if (keys.length > MAX_RETAINED_TIMINGS) {
        const keysToKeep = keys.slice(-MAX_RETAINED_TIMINGS);
        const pruned: Record<string, MessageTiming> = {};
        for (const key of keysToKeep) {
          pruned[key] = newTimings[key]!;
        }
        return pruned;
      }

      return newTimings;
    });
  }, []);

  const lastAssistantMsg = useMemo(
    () => findLastAssistantMessage(messages),
    [messages],
  );
  const lastMessageId = lastAssistantMsg?.id;
  const contentSnapshot = useMemo(
    () => getContentSnapshot(lastAssistantMsg),
    [lastAssistantMsg],
  );

  useEffect(() => {
    const prevIsRunning = prevIsRunningRef.current;

    if (isRunning && !prevIsRunning) {
      pendingStreamStartRef.current = Date.now();
    }

    if (isRunning && lastAssistantMsg) {
      let tracker = trackersRef.current[lastAssistantMsg.id];

      if (!tracker || tracker.endTime !== undefined) {
        const streamStartTime = pendingStreamStartRef.current ?? Date.now();
        tracker = createTracker(streamStartTime);
        trackersRef.current[lastAssistantMsg.id] = tracker;
        pendingStreamStartRef.current = null;

        const messageIds = new Set(messages.map((m) => m.id));
        for (const id of Object.keys(trackersRef.current)) {
          const t = trackersRef.current[id];
          if (t && t.endTime !== undefined && !messageIds.has(id)) {
            delete trackersRef.current[id];
          }
        }
      }

      if (contentSnapshot !== tracker.lastContentSnapshot) {
        recordChunk(tracker);
        tracker.lastContentSnapshot = contentSnapshot;

        const hasTextContent = lastAssistantMsg.parts?.some(
          (part) => part.type === "text" && part.text.length > 0,
        );
        if (hasTextContent) {
          recordFirstToken(tracker);
        }
      }
    }

    if (!isRunning && prevIsRunning) {
      pendingStreamStartRef.current = null;

      if (lastAssistantMsg) {
        const tracker = trackersRef.current[lastAssistantMsg.id];
        if (tracker && !tracker.endTime) {
          tracker.endTime = Date.now();
          const timing = calculateTiming(tracker, lastAssistantMsg);
          addTiming(lastAssistantMsg.id, timing);
        }
      }
    }

    prevIsRunningRef.current = isRunning;
  }, [
    isRunning,
    lastMessageId,
    contentSnapshot,
    lastAssistantMsg,
    addTiming,
    messages,
  ]);

  useEffect(() => {
    if (!lastAssistantMsg || isRunning) return;

    const usage = getUsageFromMessage(lastAssistantMsg);
    const currentTiming = timings[lastAssistantMsg.id];

    if (usage && currentTiming && !currentTiming.usage) {
      const tracker = trackersRef.current[lastAssistantMsg.id];
      if (tracker) {
        const updatedTiming = calculateTiming(tracker, lastAssistantMsg);
        addTiming(lastAssistantMsg.id, updatedTiming);
      }
    }
  }, [lastAssistantMsg, isRunning, timings, addTiming]);

  return timings;
}
