"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAssistantState } from "@assistant-ui/react";
import { useIncognitoOptional } from "@/contexts/incognito-provider";
import { useNavigationOptional } from "@/contexts/navigation-provider";

export function useSyncThreadUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const prevRemoteIdRef = useRef<string | undefined>(undefined);
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;
  const navigation = useNavigationOptional();

  const remoteId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);

  useEffect(() => {
    if (isIncognito) {
      prevRemoteIdRef.current = remoteId;
      return;
    }

    // Only navigate when:
    // 1. We're on the home page (/)
    // 2. Thread has a remoteId (initialized)
    // 3. Thread is not empty (user has sent a message)
    // 4. remoteId changed from undefined to a value
    if (
      pathname === "/" &&
      remoteId &&
      !isEmpty &&
      prevRemoteIdRef.current !== remoteId
    ) {
      // Update the chatId in context immediately before navigation
      // This ensures ChatContent has the correct chatId during the transition
      navigation?.setChatId(remoteId);

      router.replace(`/chat/${remoteId}`);
    }

    prevRemoteIdRef.current = remoteId;
  }, [pathname, remoteId, isEmpty, router, isIncognito, navigation]);
}
