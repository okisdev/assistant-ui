import { relations } from "drizzle-orm";
import {
  account,
  session,
  user,
  chat,
  chatMessage,
  share,
  chatVote,
} from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  chats: many(chat),
  shares: many(share),
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

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  messages: many(chatMessage),
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
