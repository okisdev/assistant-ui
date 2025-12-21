"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAssistantState } from "@assistant-ui/react";

export function useSyncThreadUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const prevRemoteIdRef = useRef<string | undefined>(undefined);

  const remoteId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);

  useEffect(() => {
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
      router.replace(`/chat/${remoteId}`);
    }

    prevRemoteIdRef.current = remoteId;
  }, [pathname, remoteId, isEmpty, router]);
}
