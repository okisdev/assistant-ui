import { env } from "@/lib/env";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  path: ".env*",
});

export default defineConfig({
  out: "./database/migrations",
  schema: "./database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
