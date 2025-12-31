import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { put } from "@vercel/blob";

import { protectedProcedure, createTRPCRouter } from "../../trpc";
import {
  userApplication,
  account,
  attachment,
  project,
} from "@/lib/database/schema";
import { getBuiltinApp } from "@/lib/integrations/apps";
import { ensureValidScopeToken } from "@/server/routers/apps/utils";
import {
  listFiles,
  searchFiles,
  getFile,
  type DriveFile,
} from "@/lib/integrations/google-drive";

const GOOGLE_DRIVE_APP_ID = "app_google_drive";

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation",
]);

const GOOGLE_DOCS_EXPORT_MAP: Record<string, string> = {
  "application/vnd.google-apps.document": "application/pdf",
  "application/vnd.google-apps.spreadsheet": "application/pdf",
  "application/vnd.google-apps.presentation": "application/pdf",
};

const PROJECT_DOC_SUPPORTED_MIME_TYPES = new Set([
  ...SUPPORTED_MIME_TYPES,
  "text/plain",
  "text/html",
  "text/markdown",
  "text/csv",
  "text/css",
  "text/javascript",
  "application/json",
  "application/xml",
  "application/javascript",
]);

async function getGoogleDriveAccessToken(
  db: typeof import("@/lib/database").database,
  userId: string,
): Promise<string> {
  const [userApp] = await db
    .select()
    .from(userApplication)
    .where(
      and(
        eq(userApplication.userId, userId),
        eq(userApplication.applicationId, GOOGLE_DRIVE_APP_ID),
        eq(userApplication.enabled, true),
      ),
    )
    .limit(1);

  if (!userApp) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Google Drive is not connected",
    });
  }

  const appDef = getBuiltinApp("google-drive");
  if (!appDef || appDef.connection.type !== "scope") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid app configuration",
    });
  }

  const [providerAccount] = await db
    .select()
    .from(account)
    .where(
      and(
        eq(account.userId, userId),
        eq(account.providerId, appDef.connection.provider),
      ),
    )
    .limit(1);

  if (!providerAccount?.accessToken) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Google account not linked",
    });
  }

  const validToken = await ensureValidScopeToken(
    db,
    providerAccount.id,
    appDef.connection.provider,
    providerAccount.accessToken,
    providerAccount.refreshToken,
    providerAccount.accessTokenExpiresAt,
  );

  return validToken;
}

async function downloadDriveFile(
  accessToken: string,
  file: DriveFile,
): Promise<{ content: ArrayBuffer; mimeType: string; filename: string }> {
  const isGoogleDoc = file.mimeType.startsWith("application/vnd.google-apps.");
  const exportMimeType = GOOGLE_DOCS_EXPORT_MAP[file.mimeType];

  let url: string;
  let finalMimeType: string;
  let filename = file.name;

  if (isGoogleDoc && exportMimeType) {
    url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
    finalMimeType = exportMimeType;
    if (!filename.toLowerCase().endsWith(".pdf")) {
      filename = `${filename}.pdf`;
    }
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    finalMimeType = file.mimeType;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const content = await response.arrayBuffer();

  return { content, mimeType: finalMimeType, filename };
}

export type DriveFileOutput = {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  modifiedTime: string | null;
  iconLink: string | null;
  thumbnailLink: string | null;
  webViewLink: string | null;
  isFolder: boolean;
  isSupported: boolean;
};

function mapDriveFile(file: DriveFile): DriveFileOutput {
  const isFolder = file.mimeType === "application/vnd.google-apps.folder";
  const isSupported = isFolder || SUPPORTED_MIME_TYPES.has(file.mimeType);

  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size ?? null,
    modifiedTime: file.modifiedTime ?? null,
    iconLink: file.iconLink ?? null,
    thumbnailLink: file.thumbnailLink ?? null,
    webViewLink: file.webViewLink ?? null,
    isFolder,
    isSupported,
  };
}

export const googleDriveRouter = createTRPCRouter({
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const [userApp] = await ctx.db
      .select()
      .from(userApplication)
      .where(
        and(
          eq(userApplication.userId, ctx.session.user.id),
          eq(userApplication.applicationId, GOOGLE_DRIVE_APP_ID),
          eq(userApplication.enabled, true),
        ),
      )
      .limit(1);

    if (!userApp) {
      return { connected: false };
    }

    const [providerAccount] = await ctx.db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, ctx.session.user.id),
          eq(account.providerId, "google"),
        ),
      )
      .limit(1);

    return { connected: !!providerAccount };
  }),

  listFiles: protectedProcedure
    .input(
      z.object({
        folderId: z.string().optional(),
        pageSize: z.number().min(1).max(50).default(20),
        pageToken: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const accessToken = await getGoogleDriveAccessToken(
        ctx.db,
        ctx.session.user.id,
      );

      let query = "trashed = false";

      if (input.folderId) {
        query += ` and '${input.folderId}' in parents`;
      } else {
        query += " and 'root' in parents";
      }

      const result = await listFiles(accessToken, {
        pageSize: input.pageSize,
        pageToken: input.pageToken,
        q: query,
        orderBy: "folder,modifiedTime desc",
      });

      return {
        files: result.files.map(mapDriveFile),
        nextPageToken: result.nextPageToken,
      };
    }),

  searchFiles: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        pageSize: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const accessToken = await getGoogleDriveAccessToken(
        ctx.db,
        ctx.session.user.id,
      );

      const result = await searchFiles(accessToken, {
        query: input.query,
        pageSize: input.pageSize,
      });

      return {
        files: result.files.map(mapDriveFile),
        nextPageToken: result.nextPageToken,
      };
    }),

  getFolderPath: protectedProcedure
    .input(z.object({ folderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const accessToken = await getGoogleDriveAccessToken(
        ctx.db,
        ctx.session.user.id,
      );

      const path: Array<{ id: string; name: string }> = [];
      let currentId: string | undefined = input.folderId;

      for (let i = 0; i < 10 && currentId; i++) {
        try {
          const file = await getFile(accessToken, currentId);
          path.unshift({ id: file.id, name: file.name });
          currentId = file.parents?.[0];
        } catch {
          break;
        }
      }

      return path;
    }),

  importFiles: protectedProcedure
    .input(
      z.object({
        fileIds: z.array(z.string()).min(1).max(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const accessToken = await getGoogleDriveAccessToken(
        ctx.db,
        ctx.session.user.id,
      );

      const results: Array<{
        fileId: string;
        success: boolean;
        attachment?: {
          id: string;
          url: string;
          name: string;
          contentType: string;
        };
        error?: string;
      }> = [];

      for (const fileId of input.fileIds) {
        try {
          const file = await getFile(accessToken, fileId);

          if (!SUPPORTED_MIME_TYPES.has(file.mimeType)) {
            results.push({
              fileId,
              success: false,
              error: `Unsupported file type: ${file.mimeType}`,
            });
            continue;
          }

          const { content, mimeType, filename } = await downloadDriveFile(
            accessToken,
            file,
          );

          const id = nanoid();
          const pathname = `attachments/${ctx.session.user.id}/${id}/${filename}`;

          const blob = await put(pathname, content, {
            access: "public",
            contentType: mimeType,
          });

          await ctx.db.insert(attachment).values({
            id,
            userId: ctx.session.user.id,
            chatId: null,
            url: blob.url,
            pathname: blob.pathname,
            contentType: mimeType,
            size: content.byteLength,
          });

          results.push({
            fileId,
            success: true,
            attachment: {
              id,
              url: blob.url,
              name: filename,
              contentType: mimeType,
            },
          });
        } catch (error) {
          results.push({
            fileId,
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to import file",
          });
        }
      }

      return { results };
    }),

  importFilesToProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        fileIds: z.array(z.string()).min(1).max(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [projectRecord] = await ctx.db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, input.projectId),
            eq(project.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!projectRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const accessToken = await getGoogleDriveAccessToken(
        ctx.db,
        ctx.session.user.id,
      );

      const results: Array<{
        fileId: string;
        success: boolean;
        document?: {
          name: string;
          url: string;
          pathname: string;
          contentType: string;
          size: number;
        };
        error?: string;
      }> = [];

      for (const fileId of input.fileIds) {
        try {
          const file = await getFile(accessToken, fileId);

          if (!PROJECT_DOC_SUPPORTED_MIME_TYPES.has(file.mimeType)) {
            results.push({
              fileId,
              success: false,
              error: `Unsupported file type: ${file.mimeType}`,
            });
            continue;
          }

          const { content, mimeType, filename } = await downloadDriveFile(
            accessToken,
            file,
          );

          const id = nanoid();
          const pathname = `project-documents/${ctx.session.user.id}/${input.projectId}/${id}/${filename}`;

          const blob = await put(pathname, content, {
            access: "public",
            contentType: mimeType,
          });

          results.push({
            fileId,
            success: true,
            document: {
              name: filename,
              url: blob.url,
              pathname: blob.pathname,
              contentType: mimeType,
              size: content.byteLength,
            },
          });
        } catch (error) {
          results.push({
            fileId,
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to import file",
          });
        }
      }

      return { results };
    }),
});
