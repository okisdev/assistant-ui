"use client";

import { useEffect, useState } from "react";
import { useAssistantApi } from "@assistant-ui/react";
import { Settings, PanelRight } from "lucide-react";

import { AppLayout } from "@/components/shared/app-layout";
import { Button } from "@/components/ui/button";
import { useProject } from "@/hooks/use-project";
import { ProjectContextPanel } from "./project-context-panel";
import { ProjectEditDialog } from "./project-edit-dialog";
import { ProjectThread } from "./project-thread";
import { cn } from "@/lib/utils";

function ProjectHeader({
  projectName,
  isPanelOpen,
  onTogglePanel,
  onOpenSettings,
}: {
  projectName: string;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-sm">{projectName}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={onOpenSettings}
      >
        <Settings className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={onTogglePanel}
      >
        <PanelRight className={cn("size-4", isPanelOpen && "text-primary")} />
      </Button>
    </div>
  );
}

function ProjectChatContentInner({
  projectId,
  projectName: initialProjectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const api = useAssistantApi();
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState(initialProjectName);

  useEffect(() => {
    // Switch to a new thread when entering the project
    api.threads().switchToNewThread();
  }, [api, projectId]);

  return (
    <>
      <AppLayout
        headerLeft={
          <ProjectHeader
            projectName={projectName}
            isPanelOpen={isPanelOpen}
            onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
            onOpenSettings={() => setIsEditDialogOpen(true)}
          />
        }
      >
        <div className="flex min-h-0 flex-1 justify-center px-4">
          <div className="flex min-h-0 w-full max-w-6xl gap-6">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-start">
              <ProjectThread
                projectId={projectId}
                welcomeMessage={`What would you like to work on in "${projectName}"?`}
              />
            </div>
            <div
              className={cn(
                "shrink-0 overflow-hidden transition-all duration-200",
                isPanelOpen ? "w-72" : "w-0",
              )}
            >
              {isPanelOpen && <ProjectContextPanel projectId={projectId} />}
            </div>
          </div>
        </div>
      </AppLayout>
      <ProjectEditDialog
        projectId={projectId}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onNameChange={setProjectName}
      />
    </>
  );
}

export function ProjectChatContent({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const projectContext = useProject();

  // Update the current project context
  useEffect(() => {
    projectContext.setCurrentProjectId(projectId);
    return () => {
      projectContext.setCurrentProjectId(null);
    };
  }, [projectId, projectContext]);

  return (
    <ProjectChatContentInner projectId={projectId} projectName={projectName} />
  );
}
