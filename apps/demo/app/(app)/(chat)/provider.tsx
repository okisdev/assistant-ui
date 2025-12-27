"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { nanoid } from "nanoid";
import {
  AssistantRuntimeProvider,
  RuntimeAdapterProvider,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  useAssistantState,
  WebSpeechSynthesisAdapter,
  type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
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
import { ModelChatTransport } from "@/lib/adapters/model-chat-transport";
import { useMemoryTools } from "@/hooks/use-memory-tools";
import { useArtifactTools } from "@/hooks/use-artifact-tools";
import { useImageTools } from "@/hooks/use-image-tools";
import { useStreamingTiming } from "@/hooks/use-streaming-timing";
import { ModelSelectionProvider } from "@/contexts/model-selection-provider";
import {
  CapabilitiesProvider,
  useCapabilities,
} from "@/contexts/capabilities-provider";
import { ArtifactToolUI } from "@/components/assistant-ui/artifact";
import { ImageToolUI } from "@/components/assistant-ui/image-tool-ui";
import { HotelsToolUI } from "@/components/assistant-ui/hotels-tool-ui";
import {
  SidePanelProvider,
  useSidePanel,
} from "@/contexts/side-panel-provider";
import { ChatLayout } from "@/components/assistant-ui/chat-layout";
import { ChatContent } from "@/components/app/chat/chat-content";
import {
  ProjectContext,
  useProject,
  type ProjectContextValue,
} from "@/hooks/use-project";
import { ChatPageProvider } from "@/contexts/chat-page-provider";
import {
  IncognitoProvider,
  useIncognito,
  useIncognitoOptional,
} from "@/contexts/incognito-provider";
import { ComposerModeProvider } from "@/contexts/composer-mode-provider";
import {
  SelectedAppsProvider,
  useSelectedApps,
} from "@/contexts/selected-apps-provider";

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

function useIncognitoThreadListAdapter(): RemoteThreadListAdapter {
  const incognitoThreadRef = useRef<{
    remoteId: string;
    title?: string;
  } | null>(null);

  return useMemo(() => {
    const adapter: RemoteThreadListAdapter = {
      async list() {
        return { threads: [] };
      },

      async initialize(_localId: string) {
        const id = `incognito-${nanoid()}`;
        incognitoThreadRef.current = { remoteId: id };
        return { remoteId: id, externalId: undefined };
      },

      async rename(_chatId: string, newTitle: string) {
        if (incognitoThreadRef.current) {
          incognitoThreadRef.current.title = newTitle;
        }
      },

      async archive(_chatId: string) {},

      async unarchive(_chatId: string) {},

      async delete(_chatId: string) {
        incognitoThreadRef.current = null;
      },

      async fetch(chatId: string) {
        if (
          incognitoThreadRef.current &&
          incognitoThreadRef.current.remoteId === chatId
        ) {
          return {
            remoteId: incognitoThreadRef.current.remoteId,
            status: "regular" as const,
            title: incognitoThreadRef.current.title,
          };
        }
        throw new Error("Incognito chat not found");
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
              text.slice(0, 50) + (text.length > 50 ? "..." : "") ||
              "Incognito Chat";
            controller.appendText(title);
          } else {
            controller.appendText("Incognito Chat");
          }
        });
      },
    };

    return adapter;
  }, []);
}

export const modelTransport = new ModelChatTransport();

const speechAdapter = new WebSpeechSynthesisAdapter();

function useCustomChatRuntime() {
  const feedback = useFeedbackAdapter();
  const attachments = useMemo(() => new BlobAttachmentAdapter(), []);
  const id = useAssistantState(({ threadListItem }) => threadListItem.id);

  const chat = useChat({
    id,
    transport: modelTransport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    experimental_throttle: 0,
  });

  const isRunning = chat.status === "submitted" || chat.status === "streaming";
  const timings = useStreamingTiming(chat.messages, isRunning);

  useEffect(() => {
    modelTransport.setTimings(timings);
  }, [timings]);

  const runtime = useAISDKRuntime(chat, {
    adapters: { feedback, attachments, speech: speechAdapter },
  });

  modelTransport.setRuntime(runtime);

  return runtime;
}

function MemoryProvider({ children }: { children: ReactNode }) {
  const utils = api.useUtils();
  const { capabilities } = useCapabilities();

  const memoryStore = useMemo(() => new DatabaseMemoryStore(utils), [utils]);

  useEffect(() => {
    memoryStore.initialize();
  }, [memoryStore]);

  useMemoryTools(memoryStore, { enabled: capabilities.memory.personalization });

  return <>{children}</>;
}

function ToolsProvider({ children }: { children: ReactNode }) {
  const { capabilities } = useCapabilities();
  const { closePanel } = useSidePanel();

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
      closePanel();
      prevThreadIdRef.current = threadId;
    }
  }, [threadId, closePanel]);

  // Register tools
  useArtifactTools({ enabled: capabilities.tools.artifacts });
  useImageTools({ enabled: capabilities.tools.imageGeneration });

  return (
    <>
      {capabilities.tools.artifacts && <ArtifactToolUI />}
      {capabilities.tools.imageGeneration && <ImageToolUI />}
      <HotelsToolUI />
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
      <CapabilitiesProvider>
        <ModelSelectionProvider>{children}</ModelSelectionProvider>
      </CapabilitiesProvider>
    </AssistantRuntimeProvider>
  );
}

function ComposerContextBinding({ children }: { children: ReactNode }) {
  const { selectedAppIds, clearApps } = useSelectedApps();
  const { setCurrentProjectId } = useProject();
  const threadId = useAssistantState(({ threadListItem }) => threadListItem.id);
  const prevThreadIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    modelTransport.selectedAppIds = selectedAppIds;
  }, [selectedAppIds]);

  useEffect(() => {
    if (
      prevThreadIdRef.current !== undefined &&
      prevThreadIdRef.current !== threadId
    ) {
      clearApps();
      setCurrentProjectId(null);
    }
    prevThreadIdRef.current = threadId;
  }, [threadId, clearApps, setCurrentProjectId]);

  return <>{children}</>;
}

function ChatProviderInner({
  children,
  projectId,
}: {
  children: ReactNode;
  projectId: string | null;
}) {
  const { isIncognito } = useIncognito();

  const databaseAdapter = useDatabaseThreadListAdapter(projectId);
  const incognitoAdapter = useIncognitoThreadListAdapter();

  const adapter = isIncognito ? incognitoAdapter : databaseAdapter;

  return (
    <RuntimeProviderInner
      key={isIncognito ? "incognito" : "regular"}
      adapter={adapter}
    >
      <ComposerContextBinding>{children}</ComposerContextBinding>
    </RuntimeProviderInner>
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
      <ChatPageProvider>
        <IncognitoProvider>
          <SidePanelProvider>
            <ComposerModeProvider>
              <SelectedAppsProvider>
                <ChatProviderInner projectId={currentProjectId}>
                  {children}
                </ChatProviderInner>
              </SelectedAppsProvider>
            </ComposerModeProvider>
          </SidePanelProvider>
        </IncognitoProvider>
      </ChatPageProvider>
    </ProjectContext.Provider>
  );
}

export function ChatUI() {
  const incognito = useIncognitoOptional();
  const isIncognito = incognito?.isIncognito ?? false;

  if (isIncognito) {
    return (
      <ToolsProvider>
        <ChatLayout>
          <ChatContent />
        </ChatLayout>
      </ToolsProvider>
    );
  }

  return (
    <MemoryProvider>
      <ToolsProvider>
        <ChatLayout>
          <ChatContent />
        </ChatLayout>
      </ToolsProvider>
    </MemoryProvider>
  );
}
