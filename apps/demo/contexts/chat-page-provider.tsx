"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ProjectInfo = {
  id: string;
  name: string;
};

export type ChatPageContextValue = {
  chatId: string | null;
  setChatId: (id: string | null) => void;
  project: ProjectInfo | null;
  setProject: (project: ProjectInfo | null) => void;
};

const ChatPageContext = createContext<ChatPageContextValue | null>(null);

type ChatPageProviderProps = {
  children: ReactNode;
};

export function ChatPageProvider({ children }: ChatPageProviderProps) {
  const [chatId, setChatIdState] = useState<string | null>(null);
  const [project, setProjectState] = useState<ProjectInfo | null>(null);

  const setChatId = useCallback((id: string | null) => {
    setChatIdState(id);
  }, []);

  const setProject = useCallback((proj: ProjectInfo | null) => {
    setProjectState(proj);
  }, []);

  return (
    <ChatPageContext.Provider
      value={{ chatId, setChatId, project, setProject }}
    >
      {children}
    </ChatPageContext.Provider>
  );
}

export function useChatPage(): ChatPageContextValue {
  const context = useContext(ChatPageContext);
  if (!context) {
    throw new Error("useChatPage must be used within a ChatPageProvider");
  }
  return context;
}

export function useChatPageOptional(): ChatPageContextValue | null {
  return useContext(ChatPageContext);
}
