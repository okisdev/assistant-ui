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

type NavigationContextValue = {
  // Current page state (set by route pages via NavigationSetter)
  chatId: string | null;
  setChatId: (id: string | null) => void;
  chatProject: ProjectInfo | null;
  setChatProject: (project: ProjectInfo | null) => void;

  // Selected project for new chats (set via composer dropdown)
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [chatId, setChatIdState] = useState<string | null>(null);
  const [chatProject, setChatProjectState] = useState<ProjectInfo | null>(null);
  const [selectedProjectId, setSelectedProjectIdState] = useState<
    string | null
  >(null);

  const setChatId = useCallback((id: string | null) => {
    setChatIdState(id);
  }, []);

  const setChatProject = useCallback((project: ProjectInfo | null) => {
    setChatProjectState(project);
  }, []);

  const setSelectedProjectId = useCallback((id: string | null) => {
    setSelectedProjectIdState(id);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        chatId,
        setChatId,
        chatProject,
        setChatProject,
        selectedProjectId,
        setSelectedProjectId,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

export function useNavigationOptional(): NavigationContextValue | null {
  return useContext(NavigationContext);
}
