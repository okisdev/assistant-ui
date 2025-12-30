"use client";

import { useEffect, useRef } from "react";
import { useAssistantApi } from "@assistant-ui/react";
import { useNavigation } from "@/contexts/navigation-provider";
import { useIncognitoOptional } from "@/contexts/incognito-provider";

export function useSyncChatThread() {
  const assistantApi = useAssistantApi();
  const { chatId } = useNavigation();
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;
  const prevChatIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (isIncognito) {
      prevChatIdRef.current = chatId;
      return;
    }

    if (chatId && chatId !== prevChatIdRef.current) {
      assistantApi.threads().switchToThread(chatId);
    } else if (prevChatIdRef.current && !chatId) {
      assistantApi.threads().switchToNewThread();
    }

    prevChatIdRef.current = chatId;
  }, [chatId, assistantApi, isIncognito]);
}
