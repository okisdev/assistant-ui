"use client";

import type { FC, ReactNode } from "react";
import { Sparkles, X, Puzzle } from "lucide-react";
import { useAssistantState } from "@assistant-ui/react";
import { useComposerMode } from "@/contexts/composer-mode-provider";
import { useSelectedApps } from "@/contexts/selected-apps-provider";
import { useProject } from "@/hooks/use-project";
import { api as trpc } from "@/utils/trpc/client";
import { cn } from "@/lib/utils";

type ComposerBadgeProps = {
  icon?: ReactNode;
  label: string;
  onRemove: () => void;
  variant?: "violet" | "muted";
  colorDot?: string;
};

const ComposerBadge: FC<ComposerBadgeProps> = ({
  icon,
  label,
  onRemove,
  variant = "muted",
  colorDot,
}) => {
  const styles = {
    violet: {
      container: "bg-violet-500/10 text-violet-500",
      button: "hover:bg-violet-500/20",
    },
    muted: {
      container: "bg-muted text-muted-foreground",
      button: "hover:bg-muted-foreground/20",
    },
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3",
        styles.container,
      )}
    >
      {colorDot && (
        <div
          className="size-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: colorDot }}
        />
      )}
      {icon}
      <span className="font-medium text-xs">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "flex size-5 items-center justify-center rounded-full transition-colors",
          styles.button,
        )}
        aria-label={`Remove ${label}`}
      >
        <X className="size-3" />
      </button>
    </div>
  );
};

export const ComposerHeader: FC = () => {
  const { mode, resetMode } = useComposerMode();
  const { currentProjectId, setCurrentProjectId } = useProject();
  const { selectedAppIds, deselectApp } = useSelectedApps();
  const isNewThread = useAssistantState(({ thread }) => thread.isEmpty);

  const { data: currentProject } = trpc.project.get.useQuery(
    { id: currentProjectId! },
    { enabled: !!currentProjectId && isNewThread },
  );

  const { data: connections } = trpc.application.userConnections.useQuery(
    undefined,
    { enabled: selectedAppIds.length > 0 && isNewThread },
  );

  const selectedApps =
    connections?.filter(
      (c) => c.isConnected && selectedAppIds.includes(c.applicationId),
    ) ?? [];

  const isImageGenerationMode = mode === "image-generation";
  const showProjectBadge = isNewThread && currentProjectId && currentProject;
  const showAppBadges = isNewThread && selectedApps.length > 0;

  if (!isImageGenerationMode && !showProjectBadge && !showAppBadges)
    return null;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {isImageGenerationMode && (
        <ComposerBadge
          icon={<Sparkles className="size-3.5" />}
          label="Image Generation"
          onRemove={resetMode}
          variant="violet"
        />
      )}
      {showProjectBadge && (
        <ComposerBadge
          label={currentProject.name}
          onRemove={() => setCurrentProjectId(null)}
          colorDot={currentProject.color || "#3b82f6"}
        />
      )}
      {showAppBadges &&
        selectedApps.map((app) => (
          <ComposerBadge
            key={app.applicationId}
            icon={
              app.application.iconUrl ? (
                <img
                  src={app.application.iconUrl}
                  alt=""
                  className="size-3.5 rounded object-contain"
                />
              ) : (
                <Puzzle className="size-3.5" />
              )
            }
            label={app.application.name}
            onRemove={() => deselectApp(app.applicationId)}
          />
        ))}
    </div>
  );
};
