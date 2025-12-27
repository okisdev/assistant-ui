import { createEnv } from "@t3-oss/env-core";
import { vercel } from "@t3-oss/env-core/presets-zod";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
    APPLICATION_GITHUB_CLIENT_ID: z
      .string()
      .min(1, "APPLICATION_GITHUB_CLIENT_ID is required"),
    APPLICATION_GITHUB_CLIENT_SECRET: z
      .string()
      .min(1, "APPLICATION_GITHUB_CLIENT_SECRET is required"),
    APPLICATION_GOOGLE_CLIENT_ID: z
      .string()
      .min(1, "APPLICATION_GOOGLE_CLIENT_ID is required"),
    APPLICATION_GOOGLE_CLIENT_SECRET: z
      .string()
      .min(1, "APPLICATION_GOOGLE_CLIENT_SECRET is required"),
    ASSISTANT_API_KEY: z.string().min(1, "ASSISTANT_API_KEY is required"),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    XAI_API_KEY: z.string().min(1, "XAI_API_KEY is required"),
    BLOB_READ_WRITE_TOKEN: z
      .string()
      .min(1, "BLOB_READ_WRITE_TOKEN is required"),
    INTEGRATION_NOTION_CLIENT_ID: z.string().optional(),
    INTEGRATION_NOTION_CLIENT_SECRET: z.string().optional(),
    INTEGRATION_SLACK_CLIENT_ID: z.string().optional(),
    INTEGRATION_SLACK_CLIENT_SECRET: z.string().optional(),
    INTEGRATION_FIGMA_CLIENT_ID: z.string().optional(),
    INTEGRATION_FIGMA_CLIENT_SECRET: z.string().optional(),
    SERPAPI_API_KEY: z.string().min(1, "SERPAPI_API_KEY is required"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_ASSISTANT_BASE_URL: z
      .string()
      .min(1, "NEXT_PUBLIC_ASSISTANT_BASE_URL is required"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    APPLICATION_GITHUB_CLIENT_ID: process.env.APPLICATION_GITHUB_CLIENT_ID,
    APPLICATION_GITHUB_CLIENT_SECRET:
      process.env.APPLICATION_GITHUB_CLIENT_SECRET,
    APPLICATION_GOOGLE_CLIENT_ID: process.env.APPLICATION_GOOGLE_CLIENT_ID,
    APPLICATION_GOOGLE_CLIENT_SECRET:
      process.env.APPLICATION_GOOGLE_CLIENT_SECRET,
    ASSISTANT_API_KEY: process.env.ASSISTANT_API_KEY,
    NEXT_PUBLIC_ASSISTANT_BASE_URL: process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    XAI_API_KEY: process.env.XAI_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    INTEGRATION_NOTION_CLIENT_ID: process.env.INTEGRATION_NOTION_CLIENT_ID,
    INTEGRATION_NOTION_CLIENT_SECRET:
      process.env.INTEGRATION_NOTION_CLIENT_SECRET,
    INTEGRATION_SLACK_CLIENT_ID: process.env.INTEGRATION_SLACK_CLIENT_ID,
    INTEGRATION_SLACK_CLIENT_SECRET:
      process.env.INTEGRATION_SLACK_CLIENT_SECRET,
    INTEGRATION_FIGMA_CLIENT_ID: process.env.INTEGRATION_FIGMA_CLIENT_ID,
    INTEGRATION_FIGMA_CLIENT_SECRET:
      process.env.INTEGRATION_FIGMA_CLIENT_SECRET,
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
  },
  emptyStringAsUndefined: true,
  extends: [vercel()],
});
