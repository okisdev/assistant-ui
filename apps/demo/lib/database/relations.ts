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
  member,
  invitation,
  organization,
} from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  projects: many(project),
  chats: many(chat),
  shares: many(share),
  attachments: many(attachment),
  memories: many(memory),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
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
