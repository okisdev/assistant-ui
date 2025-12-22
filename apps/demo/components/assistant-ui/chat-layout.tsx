"use client";

import type { FC, ReactNode } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useArtifact } from "@/lib/artifact-context";
import { ArtifactSidePanel } from "./artifact-side-panel";

type ChatLayoutProps = {
  children: ReactNode;
};

export const ChatLayout: FC<ChatLayoutProps> = ({ children }) => {
  const { isOpen } = useArtifact();

  if (!isOpen) {
    return <>{children}</>;
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={50} minSize={30}>
        {children}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <ArtifactSidePanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
