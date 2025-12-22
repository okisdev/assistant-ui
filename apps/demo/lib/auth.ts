import { database } from "@/lib/database";
import { env } from "@/lib/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/lib/database/schema";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(database, {
    provider: "pg",
    schema: schema,
  }),
  account: {
    accountLinking: {
      trustedProviders: ["google", "github"],
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    github: {
      clientId: env.APPLICATION_GITHUB_CLIENT_ID,
      clientSecret: env.APPLICATION_GITHUB_CLIENT_SECRET,
    },
    google: {
      accessType: "offline",
      prompt: "select_account consent",
      clientId: env.APPLICATION_GOOGLE_CLIENT_ID,
      clientSecret: env.APPLICATION_GOOGLE_CLIENT_SECRET,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "memory",
    customRules: {
      "/auth/*": {
        window: 60,
        max: 5,
      },
      "/forgot-password": {
        window: 60,
        max: 3,
      },
      "/reset-password": {
        window: 60,
        max: 5,
      },
    },
  },
  plugins: [organization()],
});
