import { database } from "@/database";
import { env } from "@/lib/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(database, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
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
});
