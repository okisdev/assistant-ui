import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import type { UserCapabilities } from "@/lib/database/schema";
import { api } from "@/utils/trpc/server";

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

export type UserContext = {
  profile: UserProfile | null;
  memories: Memory[];
  capabilities: Required<UserCapabilities>;
  projectContext: ProjectContext | null;
};

export async function getUserContext(
  chatId: string | null,
): Promise<UserContext> {
  const [profile, capabilities] = await Promise.all([
    api.user.getProfile(),
    api.user.getCapabilities(),
  ]);

  const resolvedCapabilities: Required<UserCapabilities> = {
    personalization: capabilities.personalization ?? true,
    chatHistoryContext: capabilities.chatHistoryContext ?? false,
    artifacts: capabilities.artifacts ?? true,
    defaultModel: capabilities.defaultModel ?? DEFAULT_MODEL_ID,
  };

  let projectId: string | null = null;
  if (chatId) {
    try {
      const chatData = await api.chat.get({ id: chatId });
      projectId = chatData?.projectId ?? null;
    } catch {
      // Chat not found or unauthorized
    }
  }

  let memories: Memory[] = [];
  if (resolvedCapabilities.personalization) {
    const memoriesResult = await api.memory.list(
      projectId ? { projectId } : undefined,
    );
    memories = memoriesResult.map((m) => ({
      id: m.id,
      content: m.content,
      category: m.category,
    }));
  }

  let projectContext: ProjectContext | null = null;
  if (projectId) {
    const [projectData, documentsResult] = await Promise.all([
      api.project.get({ id: projectId }),
      api.project.getDocumentsWithContent({ projectId }),
    ]);

    if (projectData) {
      projectContext = {
        instructions: projectData.instructions,
        documents: documentsResult
          .filter((doc) => doc.extractedText)
          .map(
            (doc) =>
              `--- Document: ${doc.name} ---\n${doc.extractedText}\n--- End of ${doc.name} ---`,
          ),
      };
    }
  }

  return {
    profile: profile
      ? {
          name: profile.name,
          nickname: profile.nickname,
          workType: profile.workType,
        }
      : null,
    memories,
    capabilities: resolvedCapabilities,
    projectContext,
  };
}
