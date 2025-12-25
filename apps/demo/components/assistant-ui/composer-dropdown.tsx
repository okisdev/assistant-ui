"use client";

import type { FC } from "react";
import Link from "next/link";
import {
  PlusIcon,
  Paperclip,
  Sparkles,
  FolderOpen,
  Check,
  ChevronRight,
  X,
  Clock,
} from "lucide-react";
import { useAssistantState, useAssistantApi } from "@assistant-ui/react";
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
import { useProject } from "@/hooks/use-project";
import { api } from "@/utils/trpc/client";
import { getFileIcon } from "@/utils/file";
import { createExistingAttachmentFile } from "@/lib/adapters/blob-attachment-adapter";

const MAX_VISIBLE_ITEMS = 3;

const getFileName = (pathname: string): string =>
  pathname.split("/").pop() || pathname;

// Design tokens for consistent styling
const contentClass = "min-w-[240px] rounded-xl p-2 shadow-lg";
const itemClass =
  "rounded-lg px-3 py-2.5 text-[13px] transition-colors focus:bg-accent/50";
const subTriggerClass =
  "rounded-lg px-3 py-2.5 text-[13px] transition-colors data-[state=open]:bg-accent/50";
const subContentClass = "min-w-[240px] rounded-xl p-2 shadow-lg";
const separatorClass = "-mx-2 my-2";

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
      <DropdownMenuSubTrigger className={subTriggerClass}>
        <Clock className="size-4" />
        <span>Recent</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={subContentClass}>
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
              className={itemClass}
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
      <DropdownMenuSubTrigger className={subTriggerClass}>
        <FolderOpen className="size-4" />
        <span>Project</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={subContentClass}>
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
            <DropdownMenuSeparator className={separatorClass} />
            <DropdownMenuItem asChild className={itemClass}>
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
                className={itemClass}
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
                <DropdownMenuSeparator className={separatorClass} />
                <DropdownMenuItem asChild className={itemClass}>
                  <Link href="/projects">
                    <span>View all ({projects.length})</span>
                    <ChevronRight className="ml-auto size-4" />
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            {currentProjectId && (
              <>
                <DropdownMenuSeparator className={separatorClass} />
                <DropdownMenuItem
                  className={itemClass}
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

export const ComposerDropdown: FC = () => {
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
      <DropdownMenuContent align="start" side="bottom" className={contentClass}>
        {supportsAttachments && (
          <>
            <DropdownMenuItem
              className={itemClass}
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
            className={itemClass}
            onClick={() => setMode("image-generation")}
          >
            <Sparkles className="size-4" />
            <span>Generate image</span>
          </DropdownMenuItem>
        )}
        {isNewThread && (
          <>
            {(supportsAttachments || supportsImageGeneration) && (
              <DropdownMenuSeparator className={separatorClass} />
            )}
            <ProjectsSubmenu />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
