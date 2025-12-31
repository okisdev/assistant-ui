import type { ResolvedUserCapabilities } from "@/lib/database/types";
import type { ConnectedApp } from "@/server/routers/apps/application";
import { api } from "@/utils/trpc/server";
import { DEFAULT_CAPABILITIES } from "./capabilities";
import { isValidModelId, DEFAULT_MODEL_ID } from "./models";

export type { ConnectedApp };

export type UserProfile = {
  name: string;
  nickname: string | null;
  workType: string | null;
};

export type Memory = {
  id: string;
  content: string;
  category: string | null;
};

export type ProjectContext = {
  instructions: string | null;
  documents: string[];
};

export type ChatContext = {
  userId: string;
  profile: UserProfile;
  memories: Memory[];
  capabilities: ResolvedUserCapabilities;
  projectContext: ProjectContext | null;
  connectedApps: ConnectedApp[];
  resolvedModelId: string;
};

export type UserContext = Omit<ChatContext, "resolvedModelId">;

type GetChatContextOptions = {
  chatId: string | null;
  requestModel: string | undefined;
};

export async function getChatContext(
  options: GetChatContextOptions,
): Promise<ChatContext> {
  const { chatId, requestModel } = options;

  const [profile, capabilities, chatData] = await Promise.all([
    api.user.profile.get(),
    api.user.capability.list(),
    chatId ? api.chat.get({ id: chatId }).catch(() => null) : null,
  ]);

  if (!profile?.id) {
    throw new Error("User profile not found");
  }

  const projectId = chatData?.projectId ?? null;

  const [memories, projectData, documentsResult, connectedApps] =
    await Promise.all([
      capabilities.memory.personalization
        ? api.memory.list(projectId ? { projectId } : undefined).then((m) =>
            m.map((item) => ({
              id: item.id,
              content: item.content,
              category: item.category,
            })),
          )
        : [],
      projectId ? api.project.get({ id: projectId }) : null,
      projectId ? api.project.getDocumentsWithContent({ projectId }) : [],
      api.apps.application.getConnectedApps(),
    ]);

  const projectContext: ProjectContext | null =
    projectId && projectData
      ? {
          instructions: projectData.instructions,
          documents: documentsResult
            .filter((doc) => doc.extractedText)
            .map(
              (doc) =>
                `--- Document: ${doc.name} ---\n${doc.extractedText}\n--- End of ${doc.name} ---`,
            ),
        }
      : null;

  const resolvedModelId = resolveModelId(
    requestModel,
    chatData?.model,
    capabilities.model.defaultId,
  );

  return {
    userId: profile.id,
    profile: {
      name: profile.name,
      nickname: profile.nickname,
      workType: profile.workType,
    },
    memories,
    capabilities,
    projectContext,
    connectedApps,
    resolvedModelId,
  };
}

function resolveModelId(
  requestModel: string | undefined,
  chatModel: string | null | undefined,
  defaultModel: string | null | undefined,
): string {
  if (requestModel && isValidModelId(requestModel)) {
    return requestModel;
  }
  if (chatModel && isValidModelId(chatModel)) {
    return chatModel;
  }
  if (defaultModel && isValidModelId(defaultModel)) {
    return defaultModel;
  }
  return DEFAULT_MODEL_ID;
}

export function getDefaultCapabilities(): ResolvedUserCapabilities {
  return {
    ...DEFAULT_CAPABILITIES,
    memory: {
      ...DEFAULT_CAPABILITIES.memory,
      personalization: false,
    },
  };
}
