"use client";

import { useMemo, type ReactNode } from "react";
import {
  AssistantCloud,
  AssistantRuntimeProvider,
  RuntimeAdapterProvider,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  useAssistantState,
  type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { createAssistantStream } from "assistant-stream";
import { authClient } from "@/lib/auth.client";
import { api } from "@/utils/trpc/client";
import {
  DualStorageHistoryAdapter,
  type DbOperations as HistoryDbOps,
} from "@/lib/adapters/dual-storage-history-adapter";

const cloud = new AssistantCloud({
  baseUrl: process.env["NEXT_PUBLIC_ASSISTANT_BASE_URL"]!,
  anonymous: true,
});

function HistoryProvider({ children }: { children?: ReactNode }) {
  const threadListItem = useAssistantState(
    ({ threadListItem }) => threadListItem,
  );
  const utils = api.useUtils();

  const db: HistoryDbOps = useMemo(
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
    () =>
      new DualStorageHistoryAdapter(
        threadListItem.id,
        db,
        cloud,
        threadListItem.externalId ?? null,
      ),
    [threadListItem.id, threadListItem.externalId, db],
  );

  return (
    <RuntimeAdapterProvider adapters={{ history }}>
      {children}
    </RuntimeAdapterProvider>
  );
}

function useDatabaseThreadListAdapter(): RemoteThreadListAdapter | null {
  const { data: session } = authClient.useSession();
  const utils = api.useUtils();

  return useMemo(() => {
    if (!session?.user?.id) return null;

    const adapter: RemoteThreadListAdapter = {
      async list() {
        const chats = await utils.chat.list.fetch();
        return {
          threads: chats.map((c) => ({
            remoteId: c.id,
            status: c.status as "regular" | "archived",
            title: c.title ?? undefined,
            externalId: c.remoteId ?? undefined,
          })),
        };
      },

      async initialize(localId: string) {
        await utils.client.chat.create.mutate({ id: localId });

        let remoteId: string | undefined;
        try {
          const result = await cloud.threads.create({
            external_id: localId,
            last_message_at: new Date(),
          });
          remoteId = result.thread_id;

          await utils.client.chat.updateRemoteId.mutate({
            id: localId,
            remoteId,
          });
        } catch (err) {
          console.error("[Backup] Failed to create cloud thread:", err);
        }

        return { remoteId: localId, externalId: remoteId };
      },

      async rename(chatId: string, newTitle: string) {
        await utils.client.chat.update.mutate({ id: chatId, title: newTitle });

        const chatData = await utils.chat.get.fetch({ id: chatId });
        if (chatData?.remoteId) {
          cloud.threads
            .update(chatData.remoteId, { title: newTitle })
            .catch((err) => {
              console.error("[Backup] Failed to rename cloud thread:", err);
            });
        }
      },

      async archive(chatId: string) {
        await utils.client.chat.update.mutate({
          id: chatId,
          status: "archived",
        });

        const chatData = await utils.chat.get.fetch({ id: chatId });
        if (chatData?.remoteId) {
          cloud.threads
            .update(chatData.remoteId, { is_archived: true })
            .catch((err) => {
              console.error("[Backup] Failed to archive cloud thread:", err);
            });
        }
      },

      async unarchive(chatId: string) {
        await utils.client.chat.update.mutate({
          id: chatId,
          status: "regular",
        });

        const chatData = await utils.chat.get.fetch({ id: chatId });
        if (chatData?.remoteId) {
          cloud.threads
            .update(chatData.remoteId, { is_archived: false })
            .catch((err) => {
              console.error("[Backup] Failed to unarchive cloud thread:", err);
            });
        }
      },

      async delete(chatId: string) {
        const chatData = await utils.chat.get.fetch({ id: chatId });

        await utils.client.chat.delete.mutate({ id: chatId });

        if (chatData?.remoteId) {
          cloud.threads.delete(chatData.remoteId).catch((err) => {
            console.error("[Backup] Failed to delete cloud thread:", err);
          });
        }
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
          externalId: chatData.remoteId ?? undefined,
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
  }, [session?.user?.id, utils]);
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

  if (!adapter) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <RuntimeProviderInner adapter={adapter}>{children}</RuntimeProviderInner>
  );
}
