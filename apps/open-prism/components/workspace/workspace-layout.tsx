"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Sidebar } from "./sidebar";
import { LatexEditor } from "./editor/latex-editor";
import { AssistantPanel } from "../assistant/assistant-panel";

export function WorkspaceLayout() {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Sidebar Panel */}
      <Panel defaultSize={15} minSize={10} maxSize={25}>
        <Sidebar />
      </Panel>

      <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-ring" />

      {/* Editor Panel */}
      <Panel defaultSize={55} minSize={30}>
        <LatexEditor />
      </Panel>

      <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-ring" />

      {/* AI Assistant Panel */}
      <Panel defaultSize={30} minSize={20} maxSize={50}>
        <AssistantPanel />
      </Panel>
    </PanelGroup>
  );
}
