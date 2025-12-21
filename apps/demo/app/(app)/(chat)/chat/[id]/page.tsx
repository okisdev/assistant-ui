"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAssistantApi } from "@assistant-ui/react";

import { Thread } from "@/components/assistant-ui/thread";
import { AppLayout } from "@/components/shared/app-layout";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const api = useAssistantApi();

  useEffect(() => {
    if (params.id) {
      api.threads().switchToThread(params.id);
    }
  }, [api, params.id]);

  return (
    <AppLayout>
      <Thread />
    </AppLayout>
  );
}
