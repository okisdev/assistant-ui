"use client";

import type { FC, ReactNode } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useSidePanel } from "@/lib/side-panel-context";
import { SidePanel } from "./side-panel";

type ChatLayoutProps = {
  children: ReactNode;
};

export const ChatLayout: FC<ChatLayoutProps> = ({ children }) => {
  const { isOpen } = useSidePanel();

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
        <SidePanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
