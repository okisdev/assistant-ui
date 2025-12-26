"use client";

import type { FC } from "react";
import Link from "next/link";
import {
  ComposerPrimitive,
  useAssistantApi,
  useAssistantState,
} from "@assistant-ui/react";
import {
  PlusIcon,
  Paperclip,
  Sparkles,
  FolderOpen,
  Check,
  ChevronRight,
  X,
  Clock,
  UploadIcon,
  ArrowRight,
  LoaderIcon,
  MicIcon,
  SquareIcon,
  Puzzle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useModelSelection } from "@/contexts/model-selection-provider";
import { useCapabilities } from "@/contexts/capabilities-provider";
import { useComposerMode } from "@/contexts/composer-mode-provider";
import { useSelectedApps } from "@/contexts/selected-apps-provider";
import { useProject } from "@/hooks/use-project";
import { api } from "@/utils/trpc/client";
import { getFileIcon } from "@/utils/file";
import { createExistingAttachmentFile } from "@/lib/adapters/blob-attachment-adapter";
import { ComposerAttachments } from "@/components/assistant-ui/attachment";

const MAX_VISIBLE_ITEMS = 3;

const getFileName = (pathname: string): string =>
  pathname.split("/").pop() || pathname;

const RecentAttachmentsSubmenu: FC = () => {
  const assistantApi = useAssistantApi();
  const { data: recentAttachments, isLoading } = api.attachment.recent.useQuery(
    { limit: MAX_VISIBLE_ITEMS },
  );

  const handleSelectAttachment = (attachment: {
    url: string;
    pathname: string;
    contentType: string;
  }) => {
    const file = createExistingAttachmentFile({
      url: attachment.url,
      name: getFileName(attachment.pathname),
      contentType: attachment.contentType,
    });
    assistantApi.composer().addAttachment(file);
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="rounded-lg px-3 py-2.5 text-[13px] transition-colors data-[state=open]:bg-accent/50">
        <Clock className="size-4" />
        <span>Recent</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-[240px] rounded-xl p-2 shadow-lg">
        {isLoading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <div className="size-4 animate-pulse rounded-md bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        ) : !recentAttachments || recentAttachments.length === 0 ? (
          <div className="px-3 py-2.5 text-[13px] text-muted-foreground">
            No recent attachments
          </div>
        ) : (
          recentAttachments.map((attachment) => (
            <DropdownMenuItem
              key={attachment.id}
              className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
              onClick={() => handleSelectAttachment(attachment)}
            >
              {getFileIcon(attachment.contentType)}
              <span className="truncate">
                {getFileName(attachment.pathname)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

const ProjectsSubmenu: FC = () => {
  const { data: projects, isLoading } = api.project.list.useQuery();
  const { currentProjectId, setCurrentProjectId } = useProject();

  const visibleProjects = projects?.slice(0, MAX_VISIBLE_ITEMS) ?? [];
  const hasMore = (projects?.length ?? 0) > MAX_VISIBLE_ITEMS;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="rounded-lg px-3 py-2.5 text-[13px] transition-colors data-[state=open]:bg-accent/50">
        <FolderOpen className="size-4" />
        <span>Project</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-[240px] rounded-xl p-2 shadow-lg">
        {isLoading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <div className="size-3 animate-pulse rounded bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        ) : !projects || projects.length === 0 ? (
          <>
            <div className="px-3 py-2.5 text-[13px] text-muted-foreground">
              No projects yet
            </div>
            <DropdownMenuSeparator className="-mx-2 my-2" />
            <DropdownMenuItem
              asChild
              className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
            >
              <Link href="/projects">
                <span>Create a project</span>
                <ChevronRight className="ml-auto size-4" />
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {visibleProjects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
                onClick={() => setCurrentProjectId(project.id)}
              >
                <div
                  className="size-3 shrink-0 rounded"
                  style={{ backgroundColor: project.color || "#3b82f6" }}
                />
                <span className="truncate">{project.name}</span>
                {currentProjectId === project.id && (
                  <Check className="ml-auto size-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            {hasMore && (
              <>
                <DropdownMenuSeparator className="-mx-2 my-2" />
                <DropdownMenuItem
                  asChild
                  className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
                >
                  <Link href="/projects">
                    <span>View all ({projects.length})</span>
                    <ChevronRight className="ml-auto size-4" />
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            {currentProjectId && (
              <>
                <DropdownMenuSeparator className="-mx-2 my-2" />
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
                  onClick={() => setCurrentProjectId(null)}
                >
                  <X className="size-4" />
                  <span>Clear selection</span>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

const AppsSubmenu: FC = () => {
  const { data: connections, isLoading } =
    api.application.userConnections.useQuery();
  const { selectedAppIds, toggleApp, clearApps } = useSelectedApps();

  const connectedApps =
    connections?.filter((c) => c.isConnected && c.enabled) ?? [];
  const visibleApps = connectedApps.slice(0, MAX_VISIBLE_ITEMS);
  const hasMore = connectedApps.length > MAX_VISIBLE_ITEMS;
  const hasSelected = selectedAppIds.length > 0;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="rounded-lg px-3 py-2.5 text-[13px] transition-colors data-[state=open]:bg-accent/50">
        <Puzzle className="size-4" />
        <span>Apps</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-[240px] rounded-xl p-2 shadow-lg">
        {isLoading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <div className="size-4 animate-pulse rounded bg-muted" />
                <div className="h-4 flex-1 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        ) : connectedApps.length === 0 ? (
          <>
            <div className="px-3 py-2.5 text-[13px] text-muted-foreground">
              No connected apps
            </div>
            <DropdownMenuSeparator className="-mx-2 my-2" />
            <DropdownMenuItem
              asChild
              className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
            >
              <Link href="/apps">
                <span>Connect apps</span>
                <ChevronRight className="ml-auto size-4" />
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {visibleApps.map((conn) => (
              <DropdownMenuItem
                key={conn.applicationId}
                className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
                onClick={(e) => {
                  e.preventDefault();
                  toggleApp(conn.applicationId);
                }}
              >
                {conn.application.iconUrl ? (
                  <img
                    src={conn.application.iconUrl}
                    alt=""
                    className="size-4 rounded object-contain"
                  />
                ) : (
                  <Puzzle className="size-4 text-muted-foreground" />
                )}
                <span className="truncate">{conn.application.name}</span>
                {selectedAppIds.includes(conn.applicationId) && (
                  <Check className="ml-auto size-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            {hasMore && (
              <>
                <DropdownMenuSeparator className="-mx-2 my-2" />
                <DropdownMenuItem
                  asChild
                  className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
                >
                  <Link href="/apps">
                    <span>View all ({connectedApps.length})</span>
                    <ChevronRight className="ml-auto size-4" />
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            {hasSelected && (
              <>
                <DropdownMenuSeparator className="-mx-2 my-2" />
                <DropdownMenuItem
                  className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
                  onClick={clearApps}
                >
                  <X className="size-4" />
                  <span>Clear selection</span>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

const ComposerDropdown: FC = () => {
  const assistantApi = useAssistantApi();
  const { model } = useModelSelection();
  const { capabilities } = useCapabilities();
  const { setMode } = useComposerMode();

  const isNewThread = useAssistantState(({ thread }) => thread.isEmpty);

  const supportsAttachments = model.capabilities.includes("image");
  const supportsImageGeneration = capabilities.tools.imageGeneration;

  const handleAddAttachment = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.hidden = true;

    const attachmentAccept = assistantApi
      .composer()
      .getState().attachmentAccept;
    if (attachmentAccept !== "*") {
      input.accept = attachmentAccept;
    }

    document.body.appendChild(input);

    input.onchange = (e) => {
      const fileList = (e.target as HTMLInputElement).files;
      if (!fileList) return;
      for (const file of fileList) {
        assistantApi.composer().addAttachment(file);
      }
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      if (!input.files || input.files.length === 0) {
        document.body.removeChild(input);
      }
    };

    input.click();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
          aria-label="Add content"
        >
          <PlusIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        className="min-w-[240px] rounded-xl p-2 shadow-lg"
      >
        {supportsAttachments && (
          <>
            <DropdownMenuItem
              className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
              onClick={handleAddAttachment}
            >
              <Paperclip className="size-4" />
              <span>Add attachment</span>
            </DropdownMenuItem>
            <RecentAttachmentsSubmenu />
          </>
        )}
        {supportsImageGeneration && (
          <DropdownMenuItem
            className="rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50"
            onClick={() => setMode("image-generation")}
          >
            <Sparkles className="size-4" />
            <span>Generate image</span>
          </DropdownMenuItem>
        )}
        {isNewThread && (
          <>
            {(supportsAttachments || supportsImageGeneration) && (
              <DropdownMenuSeparator className="-mx-2 my-2" />
            )}
            <ProjectsSubmenu />
            <AppsSubmenu />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type ComposerActionButtonProps = {
  isListening: boolean;
  isSpeechSupported: boolean;
  hasUploadingAttachments: boolean;
  startListening: () => void;
  stopListening: () => void;
};

const ComposerActionButton: FC<ComposerActionButtonProps> = ({
  isListening,
  isSpeechSupported,
  hasUploadingAttachments,
  startListening,
  stopListening,
}) => {
  const isRunning = useAssistantState(({ thread }) => thread.isRunning);
  const hasText = useAssistantState(
    ({ composer }) => composer.text.trim().length > 0,
  );

  if (isListening) {
    return (
      <Button
        type="button"
        size="icon"
        className="shrink-0 rounded-full"
        onClick={stopListening}
      >
        <SquareIcon className="size-3 animate-pulse fill-current" />
      </Button>
    );
  }

  if (isRunning) {
    return (
      <ComposerPrimitive.Cancel asChild>
        <Button size="icon" className="shrink-0 rounded-full">
          <SquareIcon className="size-3 fill-current" />
        </Button>
      </ComposerPrimitive.Cancel>
    );
  }

  if (hasUploadingAttachments) {
    return (
      <Button size="icon" className="shrink-0 rounded-full" disabled>
        <LoaderIcon className="size-4 animate-spin" />
      </Button>
    );
  }

  if (hasText) {
    return (
      <ComposerPrimitive.Send asChild>
        <Button size="icon" className="shrink-0 rounded-full">
          <ArrowRight className="size-4" />
        </Button>
      </ComposerPrimitive.Send>
    );
  }

  if (isSpeechSupported) {
    return (
      <Button
        type="button"
        size="icon"
        className="shrink-0 rounded-full"
        onClick={startListening}
      >
        <MicIcon className="size-4" />
      </Button>
    );
  }

  return (
    <ComposerPrimitive.Send asChild>
      <Button size="icon" className="shrink-0 rounded-full">
        <ArrowRight className="size-4" />
      </Button>
    </ComposerPrimitive.Send>
  );
};

type ComposerInputProps = {
  placeholder: string;
  isListening: boolean;
  isSpeechSupported: boolean;
  hasUploadingAttachments: boolean;
  startListening: () => void;
  stopListening: () => void;
};

export const ComposerInput: FC<ComposerInputProps> = ({
  placeholder,
  isListening,
  isSpeechSupported,
  hasUploadingAttachments,
  startListening,
  stopListening,
}) => {
  return (
    <ComposerPrimitive.AttachmentDropzone className="group/dropzone relative flex w-full flex-col outline-none">
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-accent/50 opacity-0 transition-opacity duration-200 group-data-[dragging=true]/dropzone:opacity-100">
        <div className="flex flex-col items-center gap-2 text-accent-foreground">
          <UploadIcon className="size-8" />
          <span className="font-medium text-sm">Drop files here</span>
        </div>
      </div>
      <ComposerAttachments />
      <div className="flex items-end gap-3">
        <ComposerDropdown />
        <ComposerPrimitive.Input
          placeholder={placeholder}
          className="peer max-h-40 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-base outline-none placeholder:text-muted-foreground"
          rows={1}
          autoFocus
        />
        <ComposerActionButton
          isListening={isListening}
          isSpeechSupported={isSpeechSupported}
          hasUploadingAttachments={hasUploadingAttachments}
          startListening={startListening}
          stopListening={stopListening}
        />
      </div>
    </ComposerPrimitive.AttachmentDropzone>
  );
};
