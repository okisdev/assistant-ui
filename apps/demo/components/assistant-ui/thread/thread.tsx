"use client";

import type { FC } from "react";
import { AssistantIf, ThreadPrimitive } from "@assistant-ui/react";

import { useAutoGenerateTitle } from "@/hooks/ai/use-auto-generate-title";
import { useSyncFeedback } from "@/lib/adapters/feedback-adapter";

import {
  AssistantMessage,
  EditComposer,
  ThreadScrollToBottom,
  ThreadViewportHeaderInset,
  UserMessage,
} from "./primitives";
import { Composer } from "./composer";

type ThreadProps = {
  welcomeMessage?: string;
};

export const Thread: FC<ThreadProps> = ({ welcomeMessage }) => {
  useAutoGenerateTitle();
  useSyncFeedback();

  return (
    <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
      <AssistantIf condition={({ thread }) => !thread.isEmpty}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-background via-60% via-background/80 to-transparent dark:via-50%" />
      </AssistantIf>

      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth px-4"
      >
        <ThreadViewportHeaderInset height={48} />

        <AssistantIf condition={({ thread }) => thread.isEmpty}>
          <ThreadWelcome message={welcomeMessage} />
        </AssistantIf>

        <AssistantIf condition={({ thread }) => !thread.isEmpty}>
          <div className="h-16 shrink-0" />
        </AssistantIf>

        <div className="mx-auto w-full max-w-2xl">
          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              EditComposer,
              AssistantMessage,
            }}
          />
        </div>

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mx-auto mt-auto w-full max-w-2xl bg-background pt-4 pb-4">
          <AssistantIf condition={({ thread }) => !thread.isEmpty}>
            <div className="pointer-events-none absolute inset-x-0 -top-12 h-12 bg-linear-to-t from-background to-transparent" />
          </AssistantIf>
          <ThreadScrollToBottom />
          <AssistantIf condition={({ thread }) => !thread.isEmpty}>
            <div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
              <Composer />
            </div>
          </AssistantIf>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

type ThreadWelcomeProps = {
  message?: string;
};

const ThreadWelcome: FC<ThreadWelcomeProps> = ({ message }) => {
  return (
    <div className="fade-in mx-auto flex w-full max-w-2xl flex-1 animate-in flex-col items-center justify-center gap-8 duration-300">
      <h1 className="fade-in slide-in-from-bottom-2 animate-in text-center font-medium text-3xl tracking-tight duration-500">
        {message || "What can I help you with?"}
      </h1>
      <div className="fade-in slide-in-from-bottom-4 w-full animate-in fill-mode-both delay-150 duration-500">
        <Composer />
      </div>
    </div>
  );
};
