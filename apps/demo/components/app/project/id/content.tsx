"use client";

import { useEffect } from "react";
import { useAssistantApi } from "@assistant-ui/react";

import { AppLayout } from "@/components/shared/app-layout";
import { ProjectContextPanel } from "./context-panel";
import { ProjectThread } from "../project-thread";

export function ProjectIdContent({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const assistantApi = useAssistantApi();

  useEffect(() => {
    // Switch to a new thread when entering the project
    assistantApi.threads().switchToNewThread();
  }, [assistantApi, projectId]);

  return (
    <AppLayout>
      <div className="flex min-h-0 flex-1 justify-center px-4">
        <div className="flex min-h-0 w-full max-w-5xl gap-6">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-start pt-12">
            <ProjectThread projectId={projectId} projectName={projectName} />
          </div>
          <div className="w-72 shrink-0 pt-12">
            <ProjectContextPanel projectId={projectId} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
