import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  jsonb,
  primaryKey,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type ChainOfThoughtMode = "off" | "auto" | "always";

export type UserCapabilities = {
  memory?: {
    personalization?: boolean;
    chatHistoryContext?: boolean;
  };
  tools?: {
    artifacts?: boolean;
    webSearch?: boolean;
    imageGeneration?: boolean;
    defaultImageModel?: string;
  };
  model?: {
    defaultId?: string;
    reasoningEnabled?: boolean;
  };
  models?: {
    enabledIds?: string[];
  };
  prompting?: {
    chainOfThought?: ChainOfThoughtMode;
  };
};

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  nickname: text("nickname"),
  workType: text("work_type"),
  capabilities: jsonb("capabilities").$type<UserCapabilities>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    instructions: text("instructions"),
    color: text("color"),
    isStarred: boolean("is_starred").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("project_userId_idx").on(table.userId)],
);

export const projectDocument = pgTable(
  "project_document",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    pathname: text("pathname").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    extractedText: text("extracted_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("project_document_projectId_idx").on(table.projectId),
    index("project_document_userId_idx").on(table.userId),
  ],
);

export const chat = pgTable(
  "chat",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "cascade",
    }),
    remoteId: text("remote_id"),
    title: text("title"),
    status: text("status").notNull().default("regular"),
    model: text("model"),
    headMessageId: text("head_message_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("chat_userId_idx").on(table.userId),
    index("chat_projectId_idx").on(table.projectId),
  ],
);

export const chatMessage = pgTable(
  "chat_message",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    role: text("role"),
    format: text("format").notNull().default("aui/v0"),
    content: jsonb("content").notNull(),
    status: jsonb("status"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_message_chatId_idx").on(table.chatId),
    index("chat_message_parentId_idx").on(table.parentId),
  ],
);

export type ShareResourceType = "chat" | "message";

export const share = pgTable(
  "share",
  {
    id: text("id").primaryKey(),
    resourceType: text("resource_type").$type<ShareResourceType>().notNull(),
    resourceId: text("resource_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").default(true).notNull(),
    snapshotAt: timestamp("snapshot_at"),
    includeBranches: boolean("include_branches").default(false).notNull(),
    headMessageId: text("head_message_id"),
    messageId: text("message_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("share_resource_idx").on(table.resourceType, table.resourceId),
    index("share_userId_idx").on(table.userId),
    index("share_messageId_idx").on(table.messageId),
  ],
);

export type VoteType = "positive" | "negative";

export const chatVote = pgTable(
  "chat_vote",
  {
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    messageId: text("message_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<VoteType>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.messageId, table.userId] }),
    index("chat_vote_userId_idx").on(table.userId),
  ],
);

export const attachment = pgTable(
  "attachment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chatId: text("chat_id").references(() => chat.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    pathname: text("pathname").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attachment_userId_idx").on(table.userId),
    index("attachment_chatId_idx").on(table.chatId),
  ],
);

export const memory = pgTable(
  "memory",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    category: text("category"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("memory_userId_idx").on(table.userId),
    index("memory_projectId_idx").on(table.projectId),
  ],
);

export const usage = pgTable(
  "usage",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chatId: text("chat_id").references(() => chat.id, { onDelete: "set null" }),
    messageId: text("message_id"),
    modelId: text("model_id").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    reasoningTokens: integer("reasoning_tokens"),
    totalTokens: integer("total_tokens").notNull(),
    estimatedCost: integer("estimated_cost"),
    finishReason: text("finish_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("usage_userId_idx").on(table.userId),
    index("usage_chatId_idx").on(table.chatId),
    index("usage_modelId_idx").on(table.modelId),
    index("usage_createdAt_idx").on(table.createdAt),
  ],
);

export type MCPTransportType = "http" | "sse";

export const mcpServer = pgTable(
  "mcp_server",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    transportType: text("transport_type")
      .$type<MCPTransportType>()
      .notNull()
      .default("http"),
    headers: jsonb("headers").$type<Record<string, string>>(),
    enabled: boolean("enabled").default(false).notNull(),
    oauthClientId: text("oauth_client_id"),
    oauthClientSecret: text("oauth_client_secret"),
    oauthAuthorizationUrl: text("oauth_authorization_url"),
    oauthTokenUrl: text("oauth_token_url"),
    oauthScope: text("oauth_scope"),
    oauthAccessToken: text("oauth_access_token"),
    oauthRefreshToken: text("oauth_refresh_token"),
    oauthTokenExpiresAt: timestamp("oauth_token_expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("mcp_server_userId_idx").on(table.userId)],
);
