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
  },
  emptyStringAsUndefined: true,
  extends: [vercel()],
});
