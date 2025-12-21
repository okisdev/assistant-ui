import {
  user,
  session,
  account,
  verification,
  chat,
  chatMessage,
  chatVote,
} from "./schema";

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Chat = typeof chat.$inferSelect;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type ChatVote = typeof chatVote.$inferSelect;
