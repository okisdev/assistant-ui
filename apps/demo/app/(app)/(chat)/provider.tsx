"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { createAssistantStream } from "assistant-stream";
import { api, useTRPCReady } from "@/utils/trpc/client";
import {
  DatabaseHistoryAdapterWithAttachments,
  type DbOperations,
} from "@/lib/adapters/database-history-adapter";
import { useFeedbackAdapter } from "@/lib/adapters/feedback-adapter";
import { BlobAttachmentAdapter } from "@/lib/adapters/blob-attachment-adapter";
import { DatabaseMemoryStore } from "@/lib/adapters/database-memory-adapter";
import { useAssistantMemory } from "@/hooks/use-assistant-memory";
import { useMemoryTools } from "@/hooks/use-memory-tools";
import { useArtifactTools } from "@/hooks/use-artifact-tools";
import { ArtifactToolUI } from "@/components/assistant-ui/artifact-tool-ui";
import {
  ArtifactProvider as ArtifactContextProvider,
  useArtifact,
} from "@/lib/artifact-context";
import { ChatLayout } from "@/components/assistant-ui/chat-layout";
import { ProjectContext, type ProjectContextValue } from "@/hooks/use-project";

function HistoryProvider({ children }: { children?: ReactNode }) {
  const threadListItem = useAssistantState(
    ({ threadListItem }) => threadListItem,
  );
  const utils = api.useUtils();

  const remoteId = threadListItem.remoteId;

  const db: DbOperations = useMemo(
    () => ({
      getMessages: async (chatId: string) => {
        const messages = await utils.chat.getMessages.fetch({ chatId });
        return messages.map((m) => ({
          id: m.id,
          chatId: m.chatId,
          parentId: m.parentId,
          role: m.role,
          format: m.format,
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
        format: string;
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
      remoteId ? new DatabaseHistoryAdapterWithAttachments(remoteId, db) : null,
    [remoteId, db],
  );

  return (
    <RuntimeAdapterProvider adapters={{ history: history ?? undefined }}>
      {children}
    </RuntimeAdapterProvider>
  );
}

function useDatabaseThreadListAdapter(
  projectId: string | null,
): RemoteThreadListAdapter {
  const utils = api.useUtils();

  return useMemo(() => {
    const adapter: RemoteThreadListAdapter = {
      async list() {
        // If projectId is set, filter chats by project
        // If projectId is null, show chats without a project
        const chats = await utils.chat.list.fetch({
          projectId: projectId ?? null,
        });
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
        // Create chat with the current project association
        await utils.client.chat.create.mutate({ id, projectId });
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
  }, [utils, projectId]);
}

function useCustomChatRuntime() {
  const feedback = useFeedbackAdapter();
  const attachments = useMemo(() => new BlobAttachmentAdapter(), []);

  return useChatRuntime({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    adapters: { feedback, attachments },
  });
}

function MemoryProvider({ children }: { children: ReactNode }) {
  const utils = api.useUtils();
  const { data: user } = api.user.getProfile.useQuery();
  const { data: capabilities } = api.user.getCapabilities.useQuery();

  const personalization = capabilities?.personalization ?? true;

  const memoryStore = useMemo(() => new DatabaseMemoryStore(utils), [utils]);

  // Always initialize the memory store (for read-only access)
  useEffect(() => {
    memoryStore.initialize();
  }, [memoryStore]);

  // Always register memory context, but only allow saving when personalization is enabled
  useAssistantMemory(memoryStore, user, { canSave: personalization });

  // Only register save_memory tool when personalization is enabled
  useMemoryTools(memoryStore, { enabled: personalization });

  return <>{children}</>;
}

function ArtifactToolsProvider({ children }: { children: ReactNode }) {
  const { data: capabilities } = api.user.getCapabilities.useQuery();
  const artifactsEnabled = capabilities?.artifacts ?? true;
  const { closeArtifact } = useArtifact();

  const threadId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );

  const prevThreadIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (prevThreadIdRef.current === undefined) {
      prevThreadIdRef.current = threadId;
      return;
    }

    if (prevThreadIdRef.current !== threadId) {
      closeArtifact();
      prevThreadIdRef.current = threadId;
    }
  }, [threadId, closeArtifact]);

  useArtifactTools({ enabled: artifactsEnabled });

  return (
    <>
      {artifactsEnabled && <ArtifactToolUI />}
      {children}
    </>
  );
}

function RuntimeProviderInner({
  children,
  adapter,
}: {
  children: ReactNode;
  adapter: RemoteThreadListAdapter;
}) {
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: useCustomChatRuntime,
    adapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MemoryProvider>
        <ArtifactToolsProvider>
          <ChatLayout>{children}</ChatLayout>
        </ArtifactToolsProvider>
      </MemoryProvider>
    </AssistantRuntimeProvider>
  );
}

function ChatProviderInner({
  children,
  projectId,
}: {
  children: ReactNode;
  projectId: string | null;
}) {
  const adapter = useDatabaseThreadListAdapter(projectId);

  return (
    <RuntimeProviderInner adapter={adapter}>{children}</RuntimeProviderInner>
  );
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const isTRPCReady = useTRPCReady();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const projectContextValue: ProjectContextValue = useMemo(
    () => ({
      currentProjectId,
      setCurrentProjectId,
    }),
    [currentProjectId],
  );

  if (!isTRPCReady) {
    return null;
  }

  return (
    <ProjectContext.Provider value={projectContextValue}>
      <ArtifactContextProvider>
        <ChatProviderInner projectId={currentProjectId}>
          {children}
        </ChatProviderInner>
      </ArtifactContextProvider>
    </ProjectContext.Provider>
  );
}
