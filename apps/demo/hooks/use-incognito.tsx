"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type IncognitoContextValue = {
  isIncognito: boolean;
  enableIncognito: () => void;
  disableIncognito: () => void;
};

const IncognitoContext = createContext<IncognitoContextValue | null>(null);

type IncognitoProviderProps = {
  children: ReactNode;
};

export function IncognitoProvider({ children }: IncognitoProviderProps) {
  const [isIncognito, setIsIncognito] = useState(false);

  const enableIncognito = useCallback(() => {
    setIsIncognito(true);
  }, []);

  const disableIncognito = useCallback(() => {
    setIsIncognito(false);
  }, []);

  return (
    <IncognitoContext.Provider
      value={{ isIncognito, enableIncognito, disableIncognito }}
    >
      {children}
    </IncognitoContext.Provider>
  );
}

export function useIncognito(): IncognitoContextValue {
  const context = useContext(IncognitoContext);
  if (!context) {
    throw new Error("useIncognito must be used within an IncognitoProvider");
  }
  return context;
}

export function useIncognitoOptional(): IncognitoContextValue | null {
  return useContext(IncognitoContext);
}
