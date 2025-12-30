import { relations } from "drizzle-orm";
import {
  account,
  session,
  user,
  project,
  projectDocument,
  chat,
  chatMessage,
  share,
  chatVote,
  attachment,
  memory,
  usage,
  member,
  invitation,
  organization,
  mcpServer,
  application,
  userApplication,
  twoFactor,
  generatedImage,
  artifact,
  artifactVersion,
} from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  twoFactors: many(twoFactor),
  projects: many(project),
  chats: many(chat),
  shares: many(share),
  attachments: many(attachment),
  memories: many(memory),
  usageRecords: many(usage),
  mcpServers: many(mcpServer),
  userApplications: many(userApplication),
  generatedImages: many(generatedImage),
  artifacts: many(artifact),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one, many }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
  userApplications: many(userApplication),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [chat.projectId],
    references: [project.id],
  }),
  messages: many(chatMessage),
  attachments: many(attachment),
  generatedImages: many(generatedImage),
  artifacts: many(artifact),
}));

export const messageRelations = relations(chatMessage, ({ one }) => ({
  chat: one(chat, {
    fields: [chatMessage.chatId],
    references: [chat.id],
  }),
  parent: one(chatMessage, {
    fields: [chatMessage.parentId],
    references: [chatMessage.id],
    relationName: "messageParent",
  }),
}));

export const shareRelations = relations(share, ({ one }) => ({
  user: one(user, {
    fields: [share.userId],
    references: [user.id],
  }),
}));

export const voteRelations = relations(chatVote, ({ one }) => ({
  chat: one(chat, {
    fields: [chatVote.chatId],
    references: [chat.id],
  }),
  user: one(user, {
    fields: [chatVote.userId],
    references: [user.id],
  }),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  user: one(user, {
    fields: [attachment.userId],
    references: [user.id],
  }),
  chat: one(chat, {
    fields: [attachment.chatId],
    references: [chat.id],
  }),
}));

export const memoryRelations = relations(memory, ({ one }) => ({
  user: one(user, {
    fields: [memory.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [memory.projectId],
    references: [project.id],
  }),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  chats: many(chat),
  documents: many(projectDocument),
  memories: many(memory),
}));

export const projectDocumentRelations = relations(
  projectDocument,
  ({ one }) => ({
    project: one(project, {
      fields: [projectDocument.projectId],
      references: [project.id],
    }),
    user: one(user, {
      fields: [projectDocument.userId],
      references: [user.id],
    }),
  }),
);

export const usageRelations = relations(usage, ({ one }) => ({
  user: one(user, {
    fields: [usage.userId],
    references: [user.id],
  }),
  chat: one(chat, {
    fields: [usage.chatId],
    references: [chat.id],
  }),
}));

export const mcpServerRelations = relations(mcpServer, ({ one }) => ({
  user: one(user, {
    fields: [mcpServer.userId],
    references: [user.id],
  }),
}));

export const applicationRelations = relations(application, ({ many }) => ({
  userApplications: many(userApplication),
}));

export const userApplicationRelations = relations(
  userApplication,
  ({ one }) => ({
    user: one(user, {
      fields: [userApplication.userId],
      references: [user.id],
    }),
    application: one(application, {
      fields: [userApplication.applicationId],
      references: [application.id],
    }),
    account: one(account, {
      fields: [userApplication.accountId],
      references: [account.id],
    }),
  }),
);

export const generatedImageRelations = relations(generatedImage, ({ one }) => ({
  user: one(user, {
    fields: [generatedImage.userId],
    references: [user.id],
  }),
  chat: one(chat, {
    fields: [generatedImage.chatId],
    references: [chat.id],
  }),
}));

export const artifactRelations = relations(artifact, ({ one, many }) => ({
  user: one(user, {
    fields: [artifact.userId],
    references: [user.id],
  }),
  chat: one(chat, {
    fields: [artifact.chatId],
    references: [chat.id],
  }),
  versions: many(artifactVersion),
}));

export const artifactVersionRelations = relations(
  artifactVersion,
  ({ one }) => ({
    artifact: one(artifact, {
      fields: [artifactVersion.artifactId],
      references: [artifact.id],
    }),
  }),
);
