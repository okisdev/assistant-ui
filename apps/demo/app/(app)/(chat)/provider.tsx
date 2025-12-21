"use client";

import { useMemo, type ReactNode } from "react";
import { nanoid } from "nanoid";
import {
  AssistantRuntimeProvider,
  RuntimeAdapterProvider,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  useAssistantState,
  type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { createAssistantStream } from "assistant-stream";
import { api } from "@/utils/trpc/client";
import {
  DatabaseHistoryAdapter,
  type DbOperations,
} from "@/lib/adapters/database-history-adapter";

function HistoryProvider({ children }: { children?: ReactNode }) {
  const threadListItem = useAssistantState(
    ({ threadListItem }) => threadListItem,
  );
  const utils = api.useUtils();

  const db: DbOperations = useMemo(
    () => ({
      getMessages: async (chatId: string) => {
        const messages = await utils.chat.getMessages.fetch({ chatId });
        return messages.map((m) => ({
          id: m.id,
          chatId: m.chatId,
          parentId: m.parentId,
          role: m.role,
          content: m.content,
          status: m.status,
          metadata: m.metadata,
          createdAt: m.createdAt,
        }));
      },
      createMessage: async (data: {
        id: string;
        chatId: string;
        parentId: string | null;
        role: string;
        content: unknown;
        status: unknown;
        metadata: unknown;
      }) => {
        await utils.client.chat.createMessage.mutate(data);
      },
    }),
    [utils],
  );

  const history = useMemo(
    () => new DatabaseHistoryAdapter(threadListItem.id, db),
    [threadListItem.id, db],
  );

  return (
    <RuntimeAdapterProvider adapters={{ history }}>
      {children}
    </RuntimeAdapterProvider>
  );
}

function useDatabaseThreadListAdapter(): RemoteThreadListAdapter {
  const utils = api.useUtils();

  return useMemo(() => {
    const adapter: RemoteThreadListAdapter = {
      async list() {
        const chats = await utils.chat.list.fetch();
        return {
          threads: chats.map((c) => ({
            remoteId: c.id,
            status: c.status as "regular" | "archived",
            title: c.title ?? undefined,
          })),
        };
      },

      async initialize(_localId: string) {
        const id = nanoid();
        await utils.client.chat.create.mutate({ id });
        return { remoteId: id, externalId: undefined };
      },

      async rename(chatId: string, newTitle: string) {
        await utils.client.chat.update.mutate({ id: chatId, title: newTitle });
      },

      async archive(chatId: string) {
        await utils.client.chat.update.mutate({
          id: chatId,
          status: "archived",
        });
      },

      async unarchive(chatId: string) {
        await utils.client.chat.update.mutate({
          id: chatId,
          status: "regular",
        });
      },

      async delete(chatId: string) {
        await utils.client.chat.delete.mutate({ id: chatId });
      },

      async fetch(chatId: string) {
        const chatData = await utils.chat.get.fetch({ id: chatId });

        if (!chatData) {
          throw new Error("Chat not found");
        }

        return {
          remoteId: chatData.id,
          status: chatData.status as "regular" | "archived",
          title: chatData.title ?? undefined,
        };
      },

      async generateTitle(_chatId: string, messages: readonly ThreadMessage[]) {
        return createAssistantStream(async (controller) => {
          const firstUserMessage = messages.find((m) => m.role === "user");
          if (firstUserMessage) {
            const text = firstUserMessage.content
              .filter(
                (c): c is { type: "text"; text: string } => c.type === "text",
              )
              .map((c) => c.text)
              .join(" ");
            const title =
              text.slice(0, 50) + (text.length > 50 ? "..." : "") || "New Chat";
            controller.appendText(title);
          } else {
            controller.appendText("New Chat");
          }
        });
      },

      unstable_Provider: HistoryProvider,
    };

    return adapter;
  }, [utils]);
}

function RuntimeProviderInner({
  children,
  adapter,
}: {
  children: ReactNode;
  adapter: RemoteThreadListAdapter;
}) {
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: useChatRuntime,
    adapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const adapter = useDatabaseThreadListAdapter();

  return (
    <RuntimeProviderInner adapter={adapter}>{children}</RuntimeProviderInner>
  );
}
