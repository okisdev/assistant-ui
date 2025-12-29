"use client";

import { useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-provider";

type ChatPageSetterProps = {
  chatId: string;
  project: { id: string; name: string } | null;
};

/**
 * A client component that sets the chat page context.
 * This is rendered by /chat/[id]/page.tsx to communicate
 * the chatId and project info to the ChatContent component.
 */
export function ChatPageSetter({ chatId, project }: ChatPageSetterProps) {
  const { setChatId, setChatProject } = useNavigation();

  useEffect(() => {
    setChatId(chatId);
    setChatProject(project);

    // Clean up when unmounting (navigating away from chat page)
    return () => {
      setChatId(null);
      setChatProject(null);
    };
  }, [chatId, project, setChatId, setChatProject]);

  // This component doesn't render anything visible
  return null;
}
