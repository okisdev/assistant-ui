import {
  user,
  session,
  account,
  verification,
  chat,
  chatMessage,
  chatVote,
  project,
  projectDocument,
  organization,
  member,
  invitation,
  share,
  attachment,
  memory,
  usage,
  generatedImage,
  artifact,
  artifactVersion,
  type UserCapabilities,
  type ChainOfThoughtMode,
  type ArtifactType,
} from "./schema";
import type { DeepRequired } from "./utils";

export type ResolvedUserCapabilities = DeepRequired<UserCapabilities>;

export type { ChainOfThoughtMode, ArtifactType };

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type Member = typeof member.$inferSelect;
export type Invitation = typeof invitation.$inferSelect;
export type Project = typeof project.$inferSelect;
export type ProjectDocument = typeof projectDocument.$inferSelect;
export type Chat = typeof chat.$inferSelect;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type Share = typeof share.$inferSelect;
export type ChatVote = typeof chatVote.$inferSelect;
export type Attachment = typeof attachment.$inferSelect;
export type Memory = typeof memory.$inferSelect;
export type Usage = typeof usage.$inferSelect;
export type GeneratedImage = typeof generatedImage.$inferSelect;
export type Artifact = typeof artifact.$inferSelect;
export type ArtifactVersion = typeof artifactVersion.$inferSelect;
