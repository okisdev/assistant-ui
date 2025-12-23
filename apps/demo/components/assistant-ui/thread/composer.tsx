"use client";

import type { FC } from "react";
import {
  AssistantIf,
  ComposerPrimitive,
  useAssistantState,
} from "@assistant-ui/react";
import { ArrowRight, LoaderIcon, SquareIcon } from "lucide-react";

import {
  ComposerAddAttachment,
  ComposerAttachments,
} from "@/components/assistant-ui/attachment";
import { ModelSelector } from "@/components/assistant-ui/model-selector";
import { Button } from "@/components/ui/button";

type ComposerProps = {
  placeholder?: string;
  /** Whether to show the model selector */
  showModelSelector?: boolean;
};

export const Composer: FC<ComposerProps> = ({
  placeholder = "Ask anything...",
  showModelSelector = true,
}) => {
  const hasUploadingAttachments = useAssistantState(({ composer }) =>
    composer.attachments.some((a) => a.status.type === "running"),
  );

  return (
    <ComposerPrimitive.Root className="group/composer w-full rounded-2xl bg-muted/50">
      <ComposerPrimitive.AttachmentDropzone className="flex w-full flex-col px-4 py-4 outline-none data-[dragging=true]:rounded-2xl data-[dragging=true]:bg-accent/30">
        <ComposerAttachments />
        <div className="flex items-center gap-3">
          <ComposerAddAttachment />
          <ComposerPrimitive.Input
            placeholder={placeholder}
            className="peer flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
            rows={1}
            autoFocus
          />
          <AssistantIf condition={({ thread }) => !thread.isRunning}>
            <ComposerPrimitive.Send asChild disabled={hasUploadingAttachments}>
              <Button
                size="icon"
                className="shrink-0 rounded-full"
                disabled={hasUploadingAttachments}
              >
                {hasUploadingAttachments ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
              </Button>
            </ComposerPrimitive.Send>
          </AssistantIf>
          <AssistantIf condition={({ thread }) => thread.isRunning}>
            <ComposerPrimitive.Cancel asChild>
              <Button size="icon" className="shrink-0 rounded-full">
                <SquareIcon className="size-3 fill-current" />
              </Button>
            </ComposerPrimitive.Cancel>
          </AssistantIf>
        </div>
        {showModelSelector && (
          <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-200 ease-out group-focus-within/composer:grid-rows-[1fr] group-focus-within/composer:opacity-100 group-has-[textarea:not(:placeholder-shown)]/composer:grid-rows-[1fr] group-has-data-[state=open]/composer:grid-rows-[1fr] group-has-[textarea:not(:placeholder-shown)]/composer:opacity-100 group-has-data-[state=open]/composer:opacity-100">
            <div className="overflow-hidden">
              <div className="flex items-center pt-3">
                <ModelSelector />
              </div>
            </div>
          </div>
        )}
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};
