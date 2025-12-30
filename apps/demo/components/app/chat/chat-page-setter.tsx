"use client";

import { useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-provider";

type ChatPageSetterProps = {
  chatId: string;
  project: { id: string; name: string } | null;
};

export function ChatPageSetter({ chatId, project }: ChatPageSetterProps) {
  const { setChatId, setChatProject, setIsChatPageInitialized } =
    useNavigation();

  useEffect(() => {
    setChatId(chatId);
    setChatProject(project);
    setIsChatPageInitialized(true);

    return () => {
      setChatId(null);
      setChatProject(null);
      setIsChatPageInitialized(false);
    };
  }, [chatId, project, setChatId, setChatProject, setIsChatPageInitialized]);

  return null;
}
