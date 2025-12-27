import type {
  ApplicationCategory,
  ApplicationStatus,
  ApplicationToolDefinition,
} from "@/lib/database/schema";

export type AppConnectionType = "scope" | "oauth" | "none";

export type ScopeConnectionConfig = {
  type: "scope";
  provider: "google" | "github";
  scopes: string[];
};

export type OAuthConnectionConfig = {
  type: "oauth";
  provider: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes?: string[];
  responseType?: string;
  additionalAuthParams?: Record<string, string>;
};

export type NoAuthConnectionConfig = {
  type: "none";
};

export type AppConnectionConfig =
  | ScopeConnectionConfig
  | OAuthConnectionConfig
  | NoAuthConnectionConfig;

export type BuiltinAppDefinition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl: string;
  category: ApplicationCategory;
  status: ApplicationStatus;
  verified: boolean;
  publisher: string;
  websiteUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  connection: AppConnectionConfig;
  tools: ApplicationToolDefinition[];
  metadata?: Record<string, unknown>;
};

export const BUILTIN_APPS: BuiltinAppDefinition[] = [
  {
    id: "app_google_calendar",
    slug: "google-calendar",
    name: "Google Calendar",
    description: "View and manage your calendar events",
    iconUrl: "/apps/icons/Google_Calendar.svg",
    category: "productivity",
    status: "published",
    verified: true,
    publisher: "assistant-ui",
    websiteUrl: "https://calendar.google.com",
    privacyPolicyUrl: "https://policies.google.com/privacy",
    termsOfServiceUrl: "https://policies.google.com/terms",
    connection: {
      type: "scope",
      provider: "google",
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    },
    tools: [
      {
        name: "list_calendar_events",
        description: "List upcoming calendar events",
      },
      {
        name: "create_calendar_event",
        description: "Create a new calendar event",
      },
      {
        name: "update_calendar_event",
        description: "Update an existing calendar event",
      },
      {
        name: "delete_calendar_event",
        description: "Delete a calendar event",
      },
    ],
  },
  {
    id: "app_google_drive",
    slug: "google-drive",
    name: "Google Drive",
    description: "Access and manage your files in Google Drive",
    iconUrl: "/apps/icons/Google_Drive.svg",
    category: "productivity",
    status: "published",
    verified: true,
    publisher: "assistant-ui",
    websiteUrl: "https://drive.google.com",
    privacyPolicyUrl: "https://policies.google.com/privacy",
    termsOfServiceUrl: "https://policies.google.com/terms",
    connection: {
      type: "scope",
      provider: "google",
      scopes: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    },
    tools: [
      {
        name: "list_drive_files",
        description: "List files in Google Drive",
      },
      {
        name: "search_drive_files",
        description: "Search for files in Google Drive",
      },
      {
        name: "get_drive_file",
        description: "Get file content from Google Drive",
      },
      {
        name: "upload_drive_file",
        description: "Upload a file to Google Drive",
      },
    ],
  },
  {
    id: "app_slack",
    slug: "slack",
    name: "Slack",
    description: "Send messages and interact with Slack workspaces",
    iconUrl: "/apps/icons/Slack.svg",
    category: "communication",
    status: "wip",
    verified: false,
    publisher: "assistant-ui",
    websiteUrl: "https://slack.com",
    privacyPolicyUrl: "https://slack.com/privacy-policy",
    termsOfServiceUrl: "https://slack.com/terms-of-service",
    connection: {
      type: "oauth",
      provider: "slack",
      authorizationUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
      scopes: ["channels:read", "chat:write", "users:read", "files:read"],
    },
    tools: [
      {
        name: "list_slack_channels",
        description: "List Slack channels",
      },
      {
        name: "send_slack_message",
        description: "Send a message to a Slack channel",
      },
      {
        name: "get_slack_messages",
        description: "Get recent messages from a channel",
      },
    ],
  },
  {
    id: "app_notion",
    slug: "notion",
    name: "Notion",
    description: "Read and write to your Notion workspace",
    iconUrl: "/apps/icons/Notion.svg",
    category: "productivity",
    status: "wip",
    verified: false,
    publisher: "assistant-ui",
    websiteUrl: "https://notion.so",
    privacyPolicyUrl:
      "https://www.notion.so/Privacy-Policy-3468d120cf614d4c9014c09f6adc9091",
    termsOfServiceUrl:
      "https://www.notion.so/Terms-and-Privacy-28ffdd083dc3473e9c2da6ec011b58ac",
    connection: {
      type: "oauth",
      provider: "notion",
      authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      responseType: "code",
      additionalAuthParams: {
        owner: "user",
      },
    },
    tools: [
      {
        name: "search_notion_pages",
        description: "Search for pages in Notion",
      },
      {
        name: "get_notion_page",
        description: "Get content from a Notion page",
      },
      {
        name: "create_notion_page",
        description: "Create a new Notion page",
      },
      {
        name: "update_notion_page",
        description: "Update a Notion page",
      },
    ],
  },
  {
    id: "app_figma",
    slug: "figma",
    name: "Figma",
    description: "Access your Figma designs and files",
    iconUrl: "/apps/icons/Figma.svg",
    category: "design",
    status: "wip",
    verified: false,
    publisher: "assistant-ui",
    websiteUrl: "https://figma.com",
    privacyPolicyUrl: "https://www.figma.com/privacy",
    termsOfServiceUrl: "https://www.figma.com/tos",
    connection: {
      type: "oauth",
      provider: "figma",
      authorizationUrl: "https://www.figma.com/oauth",
      tokenUrl: "https://api.figma.com/v1/oauth/token",
      scopes: ["files:read"],
      responseType: "code",
    },
    tools: [
      {
        name: "list_figma_files",
        description: "List Figma files",
      },
      {
        name: "get_figma_file",
        description: "Get details of a Figma file",
      },
      {
        name: "get_figma_comments",
        description: "Get comments from a Figma file",
      },
    ],
  },
  {
    id: "app_github",
    slug: "github",
    name: "GitHub",
    description: "Manage repositories, issues, and pull requests",
    iconUrl: "/apps/icons/GitHub.svg",
    category: "development",
    status: "wip",
    verified: false,
    publisher: "assistant-ui",
    websiteUrl: "https://github.com",
    privacyPolicyUrl:
      "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
    termsOfServiceUrl:
      "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service",
    connection: {
      type: "scope",
      provider: "github",
      scopes: ["repo", "read:user"],
    },
    tools: [
      {
        name: "list_github_repos",
        description: "List GitHub repositories",
      },
      {
        name: "get_github_repo",
        description: "Get repository details",
      },
      {
        name: "list_github_issues",
        description: "List issues in a repository",
      },
      {
        name: "create_github_issue",
        description: "Create a new issue",
      },
      {
        name: "list_github_prs",
        description: "List pull requests",
      },
    ],
  },
  {
    id: "app_google_hotels",
    slug: "google-hotels",
    name: "Google Hotels",
    description: "Search and compare hotel prices worldwide",
    iconUrl: "/apps/icons/Google_Hotels.svg",
    category: "other",
    status: "published",
    verified: true,
    publisher: "assistant-ui",
    websiteUrl: "https://www.google.com/travel/hotels",
    privacyPolicyUrl: "https://policies.google.com/privacy",
    termsOfServiceUrl: "https://policies.google.com/terms",
    connection: {
      type: "none",
    },
    tools: [
      {
        name: "search",
        description: "Search hotels by location and dates",
      },
    ],
  },
];

export function getBuiltinApp(slug: string): BuiltinAppDefinition | undefined {
  return BUILTIN_APPS.find((app) => app.slug === slug);
}

export function getBuiltinAppById(
  id: string,
): BuiltinAppDefinition | undefined {
  return BUILTIN_APPS.find((app) => app.id === id);
}

export function getBuiltinAppByProvider(
  provider: string,
): BuiltinAppDefinition | undefined {
  return BUILTIN_APPS.find(
    (app) =>
      app.connection.type !== "none" && app.connection.provider === provider,
  );
}
