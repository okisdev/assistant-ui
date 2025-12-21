import { useCallback } from "react";
import { FeedbackAdapter, useAssistantState } from "@assistant-ui/react";
import { api } from "@/utils/trpc/client";

export function useFeedbackAdapter(): FeedbackAdapter | undefined {
  const threadListItem = useAssistantState(
    ({ threadListItem }) => threadListItem,
  );
  const utils = api.useUtils();
  const chatId = threadListItem.remoteId;

  const submit = useCallback<FeedbackAdapter["submit"]>(
    ({ message, type }) => {
      if (!chatId) return;
      utils.client.chat.vote.submit.mutate({
        chatId,
        messageId: message.id,
        type,
      });
    },
    [chatId, utils],
  );

  if (!chatId) return undefined;

  return { submit };
}
