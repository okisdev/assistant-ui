import { z } from "zod";
import { eq, desc, and, isNull, ilike, or, sql } from "drizzle-orm";
import {
  chat,
  chatMessage,
  project,
  artifact,
  attachment,
  memory,
} from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

export const searchRouter = createTRPCRouter({
  // Get recent items for default view (no search query)
  recent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(3) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 3;

      const [chats, projects, artifacts, attachments, memories] =
        await Promise.all([
          ctx.db
            .select({
              id: chat.id,
              remoteId: chat.remoteId,
              title: chat.title,
              updatedAt: chat.updatedAt,
            })
            .from(chat)
            .where(
              and(eq(chat.userId, ctx.session.user.id), isNull(chat.deletedAt)),
            )
            .orderBy(desc(chat.updatedAt))
            .limit(limit),

          ctx.db
            .select({
              id: project.id,
              name: project.name,
              color: project.color,
              updatedAt: project.updatedAt,
            })
            .from(project)
            .where(eq(project.userId, ctx.session.user.id))
            .orderBy(desc(project.updatedAt))
            .limit(limit),

          ctx.db
            .select({
              id: artifact.id,
              title: artifact.title,
              chatId: artifact.chatId,
              chatTitle: chat.title,
              updatedAt: artifact.updatedAt,
            })
            .from(artifact)
            .innerJoin(chat, eq(artifact.chatId, chat.id))
            .where(eq(artifact.userId, ctx.session.user.id))
            .orderBy(desc(artifact.updatedAt))
            .limit(limit),

          ctx.db
            .select({
              id: attachment.id,
              pathname: attachment.pathname,
              contentType: attachment.contentType,
              chatId: attachment.chatId,
              chatTitle: chat.title,
              createdAt: attachment.createdAt,
            })
            .from(attachment)
            .leftJoin(chat, eq(attachment.chatId, chat.id))
            .where(eq(attachment.userId, ctx.session.user.id))
            .orderBy(desc(attachment.createdAt))
            .limit(limit),

          ctx.db
            .select({
              id: memory.id,
              content: memory.content,
              category: memory.category,
              projectId: memory.projectId,
              createdAt: memory.createdAt,
            })
            .from(memory)
            .where(eq(memory.userId, ctx.session.user.id))
            .orderBy(desc(memory.createdAt))
            .limit(limit),
        ]);

      return { chats, projects, artifacts, attachments, memories };
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;
      const pattern = `%${query}%`;

      const [chats, projects, artifacts, attachments, memories, messages] =
        await Promise.all([
          // Search chats by title
          ctx.db
            .select({
              id: chat.id,
              remoteId: chat.remoteId,
              title: chat.title,
              updatedAt: chat.updatedAt,
            })
            .from(chat)
            .where(
              and(
                eq(chat.userId, ctx.session.user.id),
                isNull(chat.deletedAt),
                ilike(chat.title, pattern),
              ),
            )
            .orderBy(desc(chat.updatedAt))
            .limit(limit),

          // Search projects by name
          ctx.db
            .select({
              id: project.id,
              name: project.name,
              color: project.color,
              updatedAt: project.updatedAt,
            })
            .from(project)
            .where(
              and(
                eq(project.userId, ctx.session.user.id),
                ilike(project.name, pattern),
              ),
            )
            .orderBy(desc(project.updatedAt))
            .limit(limit),

          // Search artifacts by title
          ctx.db
            .select({
              id: artifact.id,
              title: artifact.title,
              chatId: artifact.chatId,
              chatTitle: chat.title,
              updatedAt: artifact.updatedAt,
            })
            .from(artifact)
            .innerJoin(chat, eq(artifact.chatId, chat.id))
            .where(
              and(
                eq(artifact.userId, ctx.session.user.id),
                ilike(artifact.title, pattern),
              ),
            )
            .orderBy(desc(artifact.updatedAt))
            .limit(limit),

          // Search attachments by pathname (filename)
          ctx.db
            .select({
              id: attachment.id,
              pathname: attachment.pathname,
              contentType: attachment.contentType,
              chatId: attachment.chatId,
              chatTitle: chat.title,
              createdAt: attachment.createdAt,
            })
            .from(attachment)
            .leftJoin(chat, eq(attachment.chatId, chat.id))
            .where(
              and(
                eq(attachment.userId, ctx.session.user.id),
                ilike(attachment.pathname, pattern),
              ),
            )
            .orderBy(desc(attachment.createdAt))
            .limit(limit),

          // Search memories by content
          ctx.db
            .select({
              id: memory.id,
              content: memory.content,
              category: memory.category,
              projectId: memory.projectId,
              createdAt: memory.createdAt,
            })
            .from(memory)
            .where(
              and(
                eq(memory.userId, ctx.session.user.id),
                ilike(memory.content, pattern),
              ),
            )
            .orderBy(desc(memory.createdAt))
            .limit(limit),

          // Search messages by content (JSONB text extraction)
          ctx.db
            .select({
              id: chatMessage.id,
              chatId: chatMessage.chatId,
              chatTitle: chat.title,
              chatRemoteId: chat.remoteId,
              role: chatMessage.role,
              content: chatMessage.content,
              createdAt: chatMessage.createdAt,
            })
            .from(chatMessage)
            .innerJoin(chat, eq(chatMessage.chatId, chat.id))
            .where(
              and(
                eq(chat.userId, ctx.session.user.id),
                isNull(chat.deletedAt),
                or(
                  // Search in text parts: content->'parts' array contains objects with 'text' field
                  sql`EXISTS (
                    SELECT 1 FROM jsonb_array_elements(${chatMessage.content}->'parts') AS p
                    WHERE p->>'type' = 'text' AND p->>'text' ILIKE ${pattern}
                  )`,
                  // Also search in direct content.text for simpler formats
                  sql`${chatMessage.content}->>'text' ILIKE ${pattern}`,
                ),
              ),
            )
            .orderBy(desc(chatMessage.createdAt))
            .limit(limit),
        ]);

      return {
        chats,
        projects,
        artifacts,
        attachments,
        memories,
        messages: messages.map((m) => ({
          ...m,
          // Extract preview text from content
          preview: extractTextPreview(m.content, query),
        })),
      };
    }),
});

function extractTextPreview(
  content: unknown,
  query: string,
  maxLength = 100,
): string {
  try {
    const contentObj = content as {
      parts?: Array<{ type?: string; text?: string }>;
      text?: string;
    };

    let text = "";

    // Try to get text from parts array
    if (Array.isArray(contentObj?.parts)) {
      const textParts = contentObj.parts
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text)
        .join(" ");
      text = textParts;
    }

    // Fallback to direct text field
    if (!text && contentObj?.text) {
      text = contentObj.text;
    }

    if (!text) return "";

    // Find the position of the query in the text
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
    }

    // Extract a window around the match
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + query.length + 70);

    let preview = text.slice(start, end);
    if (start > 0) preview = `...${preview}`;
    if (end < text.length) preview = `${preview}...`;

    return preview;
  } catch {
    return "";
  }
}
