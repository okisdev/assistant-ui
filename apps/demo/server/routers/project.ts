import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

import { project, projectDocument, chat, share } from "@/lib/database/schema";
import { protectedProcedure, createTRPCRouter } from "../trpc";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db
      .select({
        id: project.id,
        name: project.name,
        instructions: project.instructions,
        color: project.color,
        isStarred: project.isStarred,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })
      .from(project)
      .where(eq(project.userId, ctx.session.user.id))
      .orderBy(desc(project.isStarred), desc(project.updatedAt));

    return projects;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        instructions: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();

      await ctx.db.insert(project).values({
        id,
        userId: ctx.session.user.id,
        name: input.name,
        instructions: input.instructions,
        color: input.color,
      });

      const [created] = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          instructions: project.instructions,
          color: project.color,
          isStarred: project.isStarred,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        })
        .from(project)
        .where(eq(project.id, id))
        .limit(1);

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        instructions: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Filter out undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );

      if (Object.keys(filteredUpdates).length > 0) {
        await ctx.db
          .update(project)
          .set(filteredUpdates)
          .where(
            and(eq(project.id, id), eq(project.userId, ctx.session.user.id)),
          );
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get all chats in this project to delete their shares
      const projectChats = await ctx.db
        .select({ id: chat.id })
        .from(chat)
        .where(
          and(
            eq(chat.projectId, input.id),
            eq(chat.userId, ctx.session.user.id),
          ),
        );

      // Delete shares for all project chats
      for (const c of projectChats) {
        await ctx.db
          .delete(share)
          .where(
            and(
              eq(share.resourceType, "chat"),
              eq(share.resourceId, c.id),
              eq(share.userId, ctx.session.user.id),
            ),
          );
      }

      // Delete the project (cascades to chats and documents)
      await ctx.db
        .delete(project)
        .where(
          and(
            eq(project.id, input.id),
            eq(project.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          instructions: project.instructions,
          color: project.color,
          isStarred: project.isStarred,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        })
        .from(project)
        .where(
          and(
            eq(project.id, input.id),
            eq(project.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    }),

  toggleStar: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First get the current star status
      const [current] = await ctx.db
        .select({ isStarred: project.isStarred })
        .from(project)
        .where(
          and(
            eq(project.id, input.id),
            eq(project.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!current) {
        throw new Error("Project not found");
      }

      // Toggle the star status
      await ctx.db
        .update(project)
        .set({ isStarred: !current.isStarred })
        .where(
          and(
            eq(project.id, input.id),
            eq(project.userId, ctx.session.user.id),
          ),
        );

      return { success: true, isStarred: !current.isStarred };
    }),

  // Document management
  listDocuments: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the project
      const projectResult = await ctx.db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, input.projectId),
            eq(project.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!projectResult[0]) {
        return [];
      }

      const documents = await ctx.db
        .select({
          id: projectDocument.id,
          name: projectDocument.name,
          url: projectDocument.url,
          pathname: projectDocument.pathname,
          contentType: projectDocument.contentType,
          size: projectDocument.size,
          createdAt: projectDocument.createdAt,
        })
        .from(projectDocument)
        .where(eq(projectDocument.projectId, input.projectId))
        .orderBy(desc(projectDocument.createdAt));

      return documents;
    }),

  addDocument: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
        url: z.string(),
        pathname: z.string(),
        contentType: z.string(),
        size: z.number(),
        extractedText: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the project
      const projectResult = await ctx.db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, input.projectId),
            eq(project.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!projectResult[0]) {
        throw new Error("Project not found");
      }

      const id = nanoid();

      await ctx.db.insert(projectDocument).values({
        id,
        projectId: input.projectId,
        userId: ctx.session.user.id,
        name: input.name,
        url: input.url,
        pathname: input.pathname,
        contentType: input.contentType,
        size: input.size,
        extractedText: input.extractedText,
      });

      const [created] = await ctx.db
        .select({
          id: projectDocument.id,
          name: projectDocument.name,
          url: projectDocument.url,
          pathname: projectDocument.pathname,
          contentType: projectDocument.contentType,
          size: projectDocument.size,
          createdAt: projectDocument.createdAt,
        })
        .from(projectDocument)
        .where(eq(projectDocument.id, id))
        .limit(1);

      return created;
    }),

  removeDocument: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(projectDocument)
        .where(
          and(
            eq(projectDocument.id, input.id),
            eq(projectDocument.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  // Get documents with extracted text for context injection
  getDocumentsWithContent: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the project
      const projectResult = await ctx.db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, input.projectId),
            eq(project.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!projectResult[0]) {
        return [];
      }

      const documents = await ctx.db
        .select({
          id: projectDocument.id,
          name: projectDocument.name,
          extractedText: projectDocument.extractedText,
        })
        .from(projectDocument)
        .where(eq(projectDocument.projectId, input.projectId));

      return documents;
    }),
});
