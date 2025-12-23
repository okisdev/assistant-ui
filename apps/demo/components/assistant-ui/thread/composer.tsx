"use client";

import type { FC } from "react";
import {
  AssistantIf,
  ComposerPrimitive,
  useAssistantState,
} from "@assistant-ui/react";
import { ArrowRight, LoaderIcon, SquareIcon, UploadIcon } from "lucide-react";

import {
  ComposerAddAttachment,
  ComposerAttachments,
} from "@/components/assistant-ui/attachment";
import {
  ModelSelector,
  ReasoningToggle,
} from "@/components/assistant-ui/model-selector";
import { Button } from "@/components/ui/button";

type ComposerProps = {
  placeholder?: string;
};

export const Composer: FC<ComposerProps> = ({
  placeholder = "Ask anything...",
}) => {
  const hasUploadingAttachments = useAssistantState(({ composer }) =>
    composer.attachments.some((a) => a.status.type === "running"),
  );

  return (
    <ComposerPrimitive.Root className="group/composer w-full rounded-2xl bg-muted/50">
      <ComposerPrimitive.AttachmentDropzone className="group/dropzone relative flex w-full flex-col px-4 py-4 outline-none">
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-accent/50 opacity-0 transition-opacity duration-200 group-data-[dragging=true]/dropzone:opacity-100">
          <div className="flex flex-col items-center gap-2 text-accent-foreground">
            <UploadIcon className="size-8" />
            <span className="font-medium text-sm">Drop files here</span>
          </div>
        </div>
        <ComposerAttachments />
        <div className="flex items-end gap-3">
          <ComposerAddAttachment />
          <ComposerPrimitive.Input
            placeholder={placeholder}
            className="peer max-h-40 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-base outline-none placeholder:text-muted-foreground"
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
        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-200 ease-out group-focus-within/composer:grid-rows-[1fr] group-focus-within/composer:opacity-100 group-has-[textarea:not(:placeholder-shown)]/composer:grid-rows-[1fr] group-has-data-[state=open]/composer:grid-rows-[1fr] group-has-[textarea:not(:placeholder-shown)]/composer:opacity-100 group-has-data-[state=open]/composer:opacity-100">
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 pt-3">
              <ModelSelector />
              <ReasoningToggle />
            </div>
          </div>
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};
