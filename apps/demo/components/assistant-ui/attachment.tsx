"use client";

import { PropsWithChildren, useEffect, useState, type FC } from "react";
import Image from "next/image";
import {
  XIcon,
  FileText,
  LoaderIcon,
  AlertCircleIcon,
  Eye,
} from "lucide-react";
import {
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useAssistantState,
  useAssistantApi,
} from "@assistant-ui/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSidePanel } from "@/contexts/side-panel-provider";
import { getFileIcon, getFileTypeLabel } from "@/utils/file";
import { cn } from "@/lib/utils";

const useFileSrc = (file: File | undefined) => {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!file) {
      setSrc(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return src;
};

const useAttachmentSrc = () => {
  const attachmentType = useAssistantState(({ attachment }) => attachment.type);
  const attachmentFile = useAssistantState(({ attachment }) =>
    attachment.type === "image" ? attachment.file : undefined,
  );
  const attachmentContent = useAssistantState(({ attachment }) => {
    if (attachment.type !== "image") return undefined;
    const imagePart = attachment.content?.find((c) => c.type === "image");
    return imagePart?.type === "image" ? imagePart.image : undefined;
  });

  const fileSrc = useFileSrc(attachmentFile);

  if (attachmentType !== "image") return undefined;
  return fileSrc ?? attachmentContent;
};

type AttachmentPreviewProps = {
  src: string;
};

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <Image
      src={src}
      alt="Image Preview"
      width={1}
      height={1}
      className={
        isLoaded
          ? "block h-auto max-h-[80vh] w-auto max-w-full object-contain"
          : "hidden"
      }
      onLoadingComplete={() => setIsLoaded(true)}
      priority={false}
    />
  );
};

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
  const src = useAttachmentSrc();

  if (!src) return children;

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer" asChild>
        {children}
      </DialogTrigger>
      <DialogContent
        className="rounded-2xl p-2 sm:max-w-3xl [&>button]:rounded-full [&>button]:bg-foreground/60 [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:ring-0! [&_svg]:text-background [&>button]:hover:[&_svg]:text-destructive"
        showCloseButton
      >
        <DialogTitle className="sr-only">Image Attachment Preview</DialogTitle>
        <div className="relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden rounded-xl bg-background">
          <AttachmentPreview src={src} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AttachmentThumb: FC = () => {
  const isImage = useAssistantState(
    ({ attachment }) => attachment.type === "image",
  );
  const src = useAttachmentSrc();

  return (
    <Avatar className="size-full rounded-none">
      <AvatarImage
        src={src}
        alt="Attachment preview"
        className="object-cover"
      />
      <AvatarFallback
        delayMs={isImage ? 200 : 0}
        className="rounded-none bg-transparent"
      >
        <FileText className="size-6 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  );
};

const AttachmentStatusOverlay: FC = () => {
  const status = useAssistantState(({ attachment }) => attachment.status);

  if (status.type === "running") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
        <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status.type === "incomplete" && status.reason === "error") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
        <AlertCircleIcon className="size-4 text-destructive" />
      </div>
    );
  }

  return null;
};

const FileAttachmentCard: FC = () => {
  const { openPanel } = useSidePanel();
  const attachmentName = useAssistantState(({ attachment }) => attachment.name);
  const attachmentContentType = useAssistantState(
    ({ attachment }) => attachment.contentType,
  );
  const attachmentContent = useAssistantState(
    ({ attachment }) => attachment.content,
  );

  const getFileUrl = (): string | undefined => {
    if (!attachmentContent || attachmentContent.length === 0) return undefined;
    const content = attachmentContent[0];
    if (content.type === "file" && "data" in content) {
      return content.data as string;
    }
    return undefined;
  };

  const handleClick = () => {
    const fileUrl = getFileUrl();
    if (!fileUrl || !attachmentName || !attachmentContentType) return;

    openPanel({
      type: "file-preview",
      title: attachmentName,
      url: fileUrl,
      mimeType: attachmentContentType,
    });
  };

  const fileTypeLabel = getFileTypeLabel(attachmentContentType ?? "");

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-left transition-colors hover:bg-muted"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/80">
        {getFileIcon(attachmentContentType ?? "")}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px]">{attachmentName}</span>
        {fileTypeLabel && (
          <span className="text-muted-foreground text-xs">{fileTypeLabel}</span>
        )}
      </div>
      <Eye className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
};

const AttachmentRemove: FC = () => {
  return (
    <AttachmentPrimitive.Remove asChild>
      <button
        type="button"
        className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-colors hover:bg-foreground/80"
        aria-label="Remove attachment"
      >
        <XIcon className="size-3" />
      </button>
    </AttachmentPrimitive.Remove>
  );
};

const AttachmentUI: FC = () => {
  const api = useAssistantApi();
  const isComposer = api.attachment.source === "composer";

  const isImage = useAssistantState(
    ({ attachment }) => attachment.type === "image",
  );
  const attachmentStatus = useAssistantState(
    ({ attachment }) => attachment.status,
  );
  const typeLabel = useAssistantState(({ attachment }) => {
    const type = attachment.type;
    switch (type) {
      case "image":
        return "Image";
      case "document":
        return "Document";
      case "file":
        return "File";
      default:
        const _exhaustiveCheck: never = type;
        throw new Error(`Unknown attachment type: ${_exhaustiveCheck}`);
    }
  });

  const isCompleteFile =
    !isImage && attachmentStatus.type === "complete" && !isComposer;

  if (isCompleteFile) {
    return <FileAttachmentCard />;
  }

  return (
    <Tooltip>
      <AttachmentPrimitive.Root
        className={cn(
          "relative",
          isImage && "only-[&>#attachment-tile]:size-20",
        )}
      >
        <AttachmentPreviewDialog>
          <TooltipTrigger asChild>
            <div
              id="attachment-tile"
              role="button"
              aria-label={`${typeLabel} attachment`}
              className={cn(
                "relative size-12 cursor-pointer overflow-hidden rounded-xl bg-muted/50 transition-opacity hover:opacity-80",
                isComposer && "ring-1 ring-foreground/5",
              )}
            >
              <AttachmentThumb />
              {isComposer && <AttachmentStatusOverlay />}
            </div>
          </TooltipTrigger>
        </AttachmentPreviewDialog>
        {isComposer && <AttachmentRemove />}
      </AttachmentPrimitive.Root>
      <TooltipContent side="top" className="rounded-lg">
        <AttachmentPrimitive.Name />
      </TooltipContent>
    </Tooltip>
  );
};

export const UserMessageAttachments: FC = () => {
  return (
    <div className="flex w-full flex-row flex-wrap justify-end gap-2 empty:hidden">
      <MessagePrimitive.Attachments components={{ Attachment: AttachmentUI }} />
    </div>
  );
};

export const ComposerAttachments: FC = () => {
  return (
    <div className="flex w-full flex-row items-center gap-3 pb-2 empty:hidden">
      <ComposerPrimitive.Attachments
        components={{ Attachment: AttachmentUI }}
      />
    </div>
  );
};
