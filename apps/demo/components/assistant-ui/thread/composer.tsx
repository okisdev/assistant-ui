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
    <ComposerPrimitive.Root className="w-full rounded-2xl bg-muted/50">
      <ComposerPrimitive.AttachmentDropzone className="flex w-full flex-col p-4 outline-none data-[dragging=true]:rounded-2xl data-[dragging=true]:bg-accent/30">
        <ComposerAttachments />
        <div className="flex items-center gap-3">
          <ComposerAddAttachment />
          <ComposerPrimitive.Input
            placeholder={placeholder}
            className="flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
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
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};
