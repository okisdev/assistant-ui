import { user, session, account, verification, chat, message } from "./schema";

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Chat = typeof chat.$inferSelect;
export type Message = typeof message.$inferSelect;
