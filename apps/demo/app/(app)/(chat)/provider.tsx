"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { nanoid } from "nanoid";
import {
  AssistantRuntimeProvider,
  RuntimeAdapterProvider,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  useAssistantState,
  useAssistantApi,
  WebSpeechSynthesisAdapter,
  type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { DevToolsModal } from "@assistant-ui/react-devtools";
import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { createAssistantStream } from "assistant-stream";
import { api, useTRPCReady } from "@/utils/trpc/client";
import {
  ReadOnlyHistoryAdapterWithAISDKFormat,
  type DbReadOperations,
} from "@/lib/adapters/readonly-history-adapter";
import { useFeedbackAdapter } from "@/lib/adapters/feedback-adapter";
import { BlobAttachmentAdapter } from "@/lib/adapters/blob-attachment-adapter";
import { z } from "zod";
import { DatabaseMemoryStore } from "@/lib/adapters/database-memory-adapter";
import { ModelChatTransport } from "@/lib/adapters/model-chat-transport";
import { useStreamingTiming } from "@/hooks/use-streaming-timing";
import { generateImageSchema } from "@/lib/ai/tools/generate-image";
import { saveMemorySchema } from "@/lib/ai/tools/save-memory";
import { updateMemorySchema } from "@/lib/ai/tools/update-memory";
import { deleteMemorySchema } from "@/lib/ai/tools/delete-memory";
import type { ImageModelId } from "@/lib/ai/models";
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
  NavigationProvider,
  useNavigation,
} from "@/contexts/navigation-provider";
import {
  IncognitoProvider,
  useIncognito,
  useIncognitoOptional,
} from "@/contexts/incognito-provider";
import { useSearchParams } from "next/navigation";
import {
  ComposerStateProvider,
  useComposerState,
} from "@/contexts/composer-state-provider";
import type { ResolvedUserCapabilities } from "@/lib/database/types";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  nickname: string | null;
  workType: string | null;
} | null;

type InitialData = {
  profile: UserProfile;
  capabilities: ResolvedUserCapabilities;
};

const InitialDataContext = createContext<InitialData | null>(null);

export function useInitialProfile(): UserProfile {
  const ctx = useContext(InitialDataContext);
  return ctx?.profile ?? null;
}

export function useInitialCapabilities(): ResolvedUserCapabilities | undefined {
  const ctx = useContext(InitialDataContext);
  return ctx?.capabilities;
}

function HistoryProvider({ children }: { children?: ReactNode }) {
  const threadListItem = useAssistantState(
    ({ threadListItem }) => threadListItem,
  );
  const utils = api.useUtils();

  const remoteId = threadListItem.remoteId;

  // Read-only database operations - messages are saved server-side
  const db: DbReadOperations = useMemo(
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
    }),
    [utils],
  );

  const history = useMemo(
    () =>
      remoteId ? new ReadOnlyHistoryAdapterWithAISDKFormat(remoteId, db) : null,
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
        const result = await utils.chat.list.fetch({
          projectId: projectId ?? null,
          limit: 100,
        });
        return {
          threads: result.items.map((c) => ({
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
  const api = useAssistantApi();
  const id = useAssistantState(({ threadListItem }) => threadListItem.id);
  const prevIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    modelTransport.setInitializeThread(() => api.threadListItem().initialize());
    return () => modelTransport.setInitializeThread(null);
  }, [api]);

  useEffect(() => {
    if (prevIdRef.current !== undefined && prevIdRef.current !== id) {
      attachments.clear();
    }
    prevIdRef.current = id;
  }, [id, attachments]);

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
  const assistantApi = useAssistantApi();

  const memoryStore = useMemo(() => new DatabaseMemoryStore(utils), [utils]);

  useEffect(() => {
    memoryStore.initialize();
  }, [memoryStore]);

  const saveMemoryTool = useMemo(
    () => ({
      parameters: saveMemorySchema,
      execute: async (args: { content: string; category?: string }) => {
        const memory = memoryStore.addMemory(args);
        return {
          success: true,
          memoryId: memory.id,
          message: `Memory saved: "${args.content}"`,
        };
      },
    }),
    [memoryStore],
  );

  const updateMemoryTool = useMemo(
    () => ({
      parameters: updateMemorySchema,
      execute: async (args: {
        id: string;
        content: string;
        category?: string;
      }) => {
        memoryStore.updateMemory(args.id, {
          content: args.content,
          category: args.category,
        });
        return {
          success: true,
          memoryId: args.id,
          message: `Memory updated: "${args.content}"`,
        };
      },
    }),
    [memoryStore],
  );

  const deleteMemoryTool = useMemo(
    () => ({
      parameters: deleteMemorySchema,
      execute: async (args: { id: string }) => {
        memoryStore.removeMemory(args.id);
        return {
          success: true,
          memoryId: args.id,
          message: "Memory deleted",
        };
      },
    }),
    [memoryStore],
  );

  useEffect(() => {
    if (!capabilities.memory.personalization) return;
    return assistantApi.modelContext().register({
      getModelContext: () => ({
        tools: {
          save_memory: saveMemoryTool,
          update_memory: updateMemoryTool,
          delete_memory: deleteMemoryTool,
        },
      }),
    });
  }, [
    assistantApi,
    saveMemoryTool,
    updateMemoryTool,
    deleteMemoryTool,
    capabilities.memory.personalization,
  ]);

  return <>{children}</>;
}

function ToolsProvider({ children }: { children: ReactNode }) {
  const { capabilities } = useCapabilities();
  const { closePanel, openPanel } = useSidePanel();
  const assistantApi = useAssistantApi();
  const searchParams = useSearchParams();
  const utils = api.useUtils();

  const threadId = useAssistantState(
    ({ threadListItem }) => threadListItem.remoteId,
  );

  const prevThreadIdRef = useRef<string | undefined>(undefined);
  const artifactIdFromUrl = searchParams.get("artifact_id");
  const artifactVersionFromUrl = searchParams.get("artifact_version");
  const hasOpenedArtifactRef = useRef<string | null>(null);

  const { data: artifactData } = api.artifact.get.useQuery(
    { id: artifactIdFromUrl! },
    {
      enabled:
        !!artifactIdFromUrl &&
        !artifactVersionFromUrl &&
        artifactIdFromUrl !== hasOpenedArtifactRef.current,
    },
  );

  const { data: artifactVersionData } = api.artifact.getVersion.useQuery(
    { id: artifactIdFromUrl!, version: Number(artifactVersionFromUrl) },
    {
      enabled:
        !!artifactIdFromUrl &&
        !!artifactVersionFromUrl &&
        `${artifactIdFromUrl}-${artifactVersionFromUrl}` !==
          hasOpenedArtifactRef.current,
    },
  );

  useEffect(() => {
    const data = artifactVersionFromUrl ? artifactVersionData : artifactData;
    const cacheKey = artifactVersionFromUrl
      ? `${artifactIdFromUrl}-${artifactVersionFromUrl}`
      : artifactIdFromUrl;

    if (
      artifactIdFromUrl &&
      data &&
      hasOpenedArtifactRef.current !== cacheKey
    ) {
      const version =
        "version" in data
          ? data.version
          : "currentVersion" in data
            ? data.currentVersion
            : undefined;

      openPanel({
        type: "artifact",
        title: data.title,
        content: data.content,
        artifactType: data.type as "html" | "react" | "svg",
        version,
        artifactId: artifactIdFromUrl,
      });
      hasOpenedArtifactRef.current = cacheKey;
    }
  }, [
    artifactIdFromUrl,
    artifactVersionFromUrl,
    artifactData,
    artifactVersionData,
    openPanel,
  ]);

  useEffect(() => {
    if (prevThreadIdRef.current === undefined) {
      prevThreadIdRef.current = threadId;
      return;
    }

    if (prevThreadIdRef.current !== threadId) {
      closePanel();
      prevThreadIdRef.current = threadId;
      hasOpenedArtifactRef.current = null;
    }
  }, [threadId, closePanel]);

  const chatId = threadId;

  const artifactTool = useMemo(
    () => ({
      parameters: z.object({
        title: z.string(),
        content: z.string(),
        type: z.enum(["html", "react", "svg"]).default("html"),
      }),
      execute: async (args: {
        title: string;
        content: string;
        type: "html" | "react" | "svg";
      }) => {
        let version = 1;
        let artifactId: string | undefined;

        if (chatId) {
          try {
            const result = await utils.client.artifact.create.mutate({
              id: nanoid(),
              chatId,
              title: args.title,
              content: args.content,
              type: args.type,
            });
            version = result.version;
            artifactId = result.id;
          } catch (error) {
            console.error("Failed to save artifact:", error);
          }
        }

        return {
          success: true,
          ...args,
          version,
          artifactId,
          message: `Created artifact: "${args.title}"`,
        };
      },
    }),
    [chatId, utils],
  );

  const imageTool = useMemo(
    () => ({
      parameters: generateImageSchema,
      execute: async (args: { prompt: string; model?: ImageModelId }) => {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...args, chatId }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate image");
        }
        return response.json();
      },
    }),
    [chatId],
  );

  useEffect(() => {
    if (!capabilities.tools.artifacts) return;
    return assistantApi.modelContext().register({
      getModelContext: () => ({ tools: { create_artifact: artifactTool } }),
    });
  }, [assistantApi, artifactTool, capabilities.tools.artifacts]);

  useEffect(() => {
    if (!capabilities.tools.imageGeneration) return;
    return assistantApi.modelContext().register({
      getModelContext: () => ({ tools: { generate_image: imageTool } }),
    });
  }, [assistantApi, imageTool, capabilities.tools.imageGeneration]);

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
  const initialCapabilities = useInitialCapabilities();
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: useCustomChatRuntime,
    adapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <CapabilitiesProvider initialData={initialCapabilities}>
        <ModelSelectionProvider>{children}</ModelSelectionProvider>
      </CapabilitiesProvider>
      {process.env.NODE_ENV === "development" && <DevToolsModal />}
    </AssistantRuntimeProvider>
  );
}

function ComposerContextBinding({ children }: { children: ReactNode }) {
  const { selectedAppIds, resetAll } = useComposerState();
  const { setSelectedProjectId } = useNavigation();
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
      resetAll();
      setSelectedProjectId(null);
    }
    prevThreadIdRef.current = threadId;
  }, [threadId, resetAll, setSelectedProjectId]);

  return <>{children}</>;
}

function ChatProviderInner({ children }: { children: ReactNode }) {
  const { isIncognito } = useIncognito();
  const { selectedProjectId } = useNavigation();

  const databaseAdapter = useDatabaseThreadListAdapter(selectedProjectId);
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

type ChatProviderProps = {
  children: ReactNode;
  initialProfile?: UserProfile;
  initialCapabilities?: ResolvedUserCapabilities;
};

export function ChatProvider({
  children,
  initialProfile,
  initialCapabilities,
}: ChatProviderProps) {
  const isTRPCReady = useTRPCReady();

  const initialData = useMemo<InitialData | null>(
    () =>
      initialProfile !== undefined && initialCapabilities !== undefined
        ? { profile: initialProfile, capabilities: initialCapabilities }
        : null,
    [initialProfile, initialCapabilities],
  );

  if (!isTRPCReady) {
    return null;
  }

  return (
    <InitialDataContext.Provider value={initialData}>
      <NavigationProvider>
        <IncognitoProvider>
          <SidePanelProvider>
            <ComposerStateProvider>
              <ChatProviderInner>{children}</ChatProviderInner>
            </ComposerStateProvider>
          </SidePanelProvider>
        </IncognitoProvider>
      </NavigationProvider>
    </InitialDataContext.Provider>
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
