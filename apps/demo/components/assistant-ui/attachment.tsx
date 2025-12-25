"use client";

import { PropsWithChildren, useEffect, useState, type FC } from "react";
import Image from "next/image";
import {
  XIcon,
  PlusIcon,
  FileText,
  LoaderIcon,
  AlertCircleIcon,
  Eye,
  FileCode,
  File,
  Image as ImageIcon,
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
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useModelSelection } from "@/contexts/model-selection-provider";
import { useSidePanel } from "@/lib/side-panel-context";
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

const getFileIcon = (mimeType: string) => {
  if (mimeType === "application/pdf") {
    return <FileText className="size-4 text-muted-foreground" />;
  }
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="size-4 text-muted-foreground" />;
  }
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  ) {
    return <FileCode className="size-4 text-muted-foreground" />;
  }
  return <File className="size-4 text-muted-foreground" />;
};

const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) {
    const subtype = mimeType.split("/")[1]?.toUpperCase();
    return subtype || "Image";
  }
  if (mimeType.startsWith("text/")) {
    const subtype = mimeType.split("/")[1];
    if (subtype === "plain") return "TXT";
    if (subtype === "markdown") return "MD";
    if (subtype === "csv") return "CSV";
    if (subtype === "html") return "HTML";
    return subtype?.toUpperCase() || "Text";
  }
  if (mimeType === "application/json") return "JSON";
  if (mimeType === "application/xml") return "XML";
  return "";
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
      <DialogTrigger
        className="cursor-pointer transition-colors hover:bg-accent"
        asChild
      >
        {children}
      </DialogTrigger>
      <DialogContent
        className="p-2 sm:max-w-3xl [&>button]:rounded-full [&>button]:bg-foreground/60 [&>button]:p-1 [&>button]:opacity-100 [&>button]:ring-0! [&_svg]:text-background [&>button]:hover:[&_svg]:text-destructive"
        showCloseButton
      >
        <DialogTitle className="sr-only">Image Attachment Preview</DialogTitle>
        <div className="relative mx-auto flex max-h-[80dvh] w-full items-center justify-center overflow-hidden bg-background">
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
    <Avatar className="h-full w-full rounded-none">
      <AvatarImage
        src={src}
        alt="Attachment preview"
        className="object-cover"
      />
      <AvatarFallback delayMs={isImage ? 200 : 0}>
        <FileText className="size-8 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  );
};

const AttachmentStatusOverlay: FC = () => {
  const status = useAssistantState(({ attachment }) => attachment.status);

  if (status.type === "running") {
    return (
      <div className="absolute inset-0 flex items-center justify-center rounded-[14px] bg-background/80">
        <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status.type === "incomplete" && status.reason === "error") {
    return (
      <div className="absolute inset-0 flex items-center justify-center rounded-[14px] bg-destructive/20">
        <AlertCircleIcon className="size-5 text-destructive" />
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
      className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
        {getFileIcon(attachmentContentType ?? "")}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">{attachmentName}</span>
        {fileTypeLabel && (
          <span className="text-muted-foreground text-xs">{fileTypeLabel}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
        <Eye className="size-3.5" />
      </div>
    </button>
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
          isImage && "only-[&>#attachment-tile]:size-24",
        )}
      >
        <AttachmentPreviewDialog>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative size-14 cursor-pointer overflow-hidden rounded-[14px] bg-muted/50 transition-opacity hover:opacity-75",
                isComposer && "border-foreground/10",
              )}
              role="button"
              id="attachment-tile"
              aria-label={`${typeLabel} attachment`}
            >
              <AttachmentThumb />
              {isComposer && <AttachmentStatusOverlay />}
            </div>
          </TooltipTrigger>
        </AttachmentPreviewDialog>
        {isComposer && <AttachmentRemove />}
      </AttachmentPrimitive.Root>
      <TooltipContent side="top">
        <AttachmentPrimitive.Name />
      </TooltipContent>
    </Tooltip>
  );
};

const AttachmentRemove: FC = () => {
  return (
    <AttachmentPrimitive.Remove asChild>
      <TooltipIconButton
        tooltip="Remove file"
        className="absolute top-1.5 right-1.5 size-4 rounded-full bg-foreground/80 text-background opacity-100 shadow-sm hover:bg-foreground! [&_svg]:size-3"
        side="top"
      >
        <XIcon />
      </TooltipIconButton>
    </AttachmentPrimitive.Remove>
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
    <div className="flex w-full flex-row items-center gap-2 overflow-x-auto px-1 pt-0.5 pb-1 empty:hidden">
      <ComposerPrimitive.Attachments
        components={{ Attachment: AttachmentUI }}
      />
    </div>
  );
};

export const ComposerAddAttachment: FC = () => {
  const { model } = useModelSelection();
  const supportsAttachments = model.capabilities.includes("image");

  if (!supportsAttachments) {
    return (
      <TooltipIconButton
        tooltip="Attachments not supported by this model"
        side="top"
        variant="ghost"
        className="size-9 cursor-not-allowed rounded-full text-muted-foreground/50"
        aria-label="Attachments not supported"
        disabled
      >
        <PlusIcon className="size-5" />
      </TooltipIconButton>
    );
  }

  return (
    <ComposerPrimitive.AddAttachment asChild>
      <TooltipIconButton
        tooltip="Add Attachment"
        side="top"
        variant="ghost"
        className="size-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Add Attachment"
      >
        <PlusIcon className="size-5" />
      </TooltipIconButton>
    </ComposerPrimitive.AddAttachment>
  );
};
