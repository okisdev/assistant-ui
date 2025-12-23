import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type LanguageModel,
} from "ai";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { database } from "@/lib/database";
import { project, projectDocument, chat, user } from "@/lib/database/schema";
import { DEFAULT_MODEL_ID, isValidModelId } from "@/lib/models";
import type { UserCapabilities } from "@/lib/database/schema";

export const maxDuration = 30;

type ModelFactory = () => LanguageModel;

const MODEL_REGISTRY: Record<string, ModelFactory> = {
  "gpt-4o": () => openai("gpt-4o"),
  "gpt-4o-mini": () => openai("gpt-4o-mini"),
  "grok-4": () => xai("grok-4"),
};

function getModel(modelId: string): LanguageModel {
  const factory = MODEL_REGISTRY[modelId];
  if (!factory) {
    console.warn(`Unknown model: ${modelId}, falling back to default`);
    return MODEL_REGISTRY[DEFAULT_MODEL_ID]!();
  }
  return factory();
}

async function getProjectContext(
  userId: string,
  chatId: string | null,
): Promise<{ instructions: string | null; documents: string[] } | null> {
  if (!chatId) return null;

  // Get the chat to find its project
  const chatResult = await database
    .select({ projectId: chat.projectId })
    .from(chat)
    .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
    .limit(1);

  const projectId = chatResult[0]?.projectId;
  if (!projectId) return null;

  // Get project details and documents
  const [projectResult, documentsResult] = await Promise.all([
    database
      .select({ instructions: project.instructions })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, userId)))
      .limit(1),
    database
      .select({
        name: projectDocument.name,
        extractedText: projectDocument.extractedText,
      })
      .from(projectDocument)
      .where(eq(projectDocument.projectId, projectId)),
  ]);

  const projectData = projectResult[0];
  if (!projectData) return null;

  // Format documents as context
  const documents = documentsResult
    .filter((doc) => doc.extractedText)
    .map(
      (doc) =>
        `--- Document: ${doc.name} ---\n${doc.extractedText}\n--- End of ${doc.name} ---`,
    );

  return {
    instructions: projectData.instructions,
    documents,
  };
}

function buildSystemPrompt(
  baseSystem: string | undefined,
  projectContext: { instructions: string | null; documents: string[] } | null,
): string {
  const parts: string[] = [];

  // Add project instructions if available
  if (projectContext?.instructions) {
    parts.push(`## Project Instructions\n${projectContext.instructions}`);
  }

  // Add base system prompt
  if (baseSystem) {
    parts.push(baseSystem);
  }

  // Add project documents as context
  if (projectContext?.documents && projectContext.documents.length > 0) {
    parts.push(
      `## Project Knowledge Base\nThe following documents are available as reference:\n\n${projectContext.documents.join("\n\n")}`,
    );
  }

  return parts.join("\n\n");
}

async function resolveModel(
  userId: string | undefined,
  chatId: string | null,
  requestModel: string | undefined,
): Promise<string> {
  // Priority: request body > chat setting > user default > global default
  if (requestModel && isValidModelId(requestModel)) {
    return requestModel;
  }

  if (userId && chatId) {
    // Check chat-specific model
    const chatResult = await database
      .select({ model: chat.model })
      .from(chat)
      .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
      .limit(1);

    if (chatResult[0]?.model && isValidModelId(chatResult[0].model)) {
      return chatResult[0].model;
    }
  }

  if (userId) {
    // Check user default model
    const userResult = await database
      .select({ capabilities: user.capabilities })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const capabilities = userResult[0]?.capabilities as UserCapabilities | null;
    if (
      capabilities?.defaultModel &&
      isValidModelId(capabilities.defaultModel)
    ) {
      return capabilities.defaultModel;
    }
  }

  return DEFAULT_MODEL_ID;
}

export async function POST(req: Request) {
  // The AI SDK sends `id` as the chat/thread identifier
  const { messages, system, tools, id, model: requestModel } = await req.json();

  // Get project context if user is authenticated and chat id is provided
  let projectContext: {
    instructions: string | null;
    documents: string[];
  } | null = null;

  const session = await auth.api.getSession({ headers: req.headers });
  if (session?.user && id) {
    projectContext = await getProjectContext(session.user.id, id);
  }

  // Resolve which model to use
  const modelId = await resolveModel(session?.user?.id, id, requestModel);

  // Build the system prompt with project context
  const enhancedSystem = buildSystemPrompt(system, projectContext);

  const result = streamText({
    model: getModel(modelId),
    messages: convertToModelMessages(messages),
    system: enhancedSystem || undefined,
    tools: {
      ...frontendTools(tools),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
