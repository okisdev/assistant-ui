"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useResumableChatRuntime } from "@assistant-ui/react-ai-sdk";
import { cn } from "@/lib/utils";

export default function Home() {
  const { runtime, isResuming, isStreamingResume, resumedAssistantMessage } =
    useResumableChatRuntime({
      api: "/api/chat",
      onResumeSuccess: (wasInterrupted) => {
        if (wasInterrupted) {
          console.log("Session restored (response was interrupted)");
        } else {
          console.log("Session restored successfully");
        }
      },
    });

  // Get text from resumed assistant message
  const resumedAssistantText = resumedAssistantMessage?.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  // Show notification when resuming
  const showNotification = isResuming || isStreamingResume;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="relative h-full">
        {showNotification && (
          <div
            className={cn(
              "absolute top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-lg",
            )}
          >
            <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>
              {isStreamingResume
                ? "Resuming AI response..."
                : "Resuming previous session..."}
            </span>
          </div>
        )}

        {/* Thread shows user message from initial messages */}
        <Thread />

        {/* Overlay for resumed AI response (shown while streaming or when complete) */}
        {resumedAssistantMessage && resumedAssistantText && (
          <div className="fixed inset-x-0 bottom-24 flex justify-center px-4">
            <div className="w-full max-w-2xl overflow-y-auto rounded-lg border bg-white p-4 shadow-xl">
              <div className="mb-2 flex items-center gap-2 font-medium text-gray-500 text-sm">
                <span>✓ Resumed Response</span>
                {isStreamingResume && (
                  <span className="ml-auto flex items-center gap-1 text-blue-500">
                    <span className="size-2 animate-pulse rounded-full bg-blue-500" />
                    streaming...
                  </span>
                )}
              </div>
              <div className="max-w-none">
                <p className="whitespace-pre-wrap">{resumedAssistantText}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AssistantRuntimeProvider>
  );
}
