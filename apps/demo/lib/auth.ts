import { cache } from "react";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, twoFactor } from "better-auth/plugins";

import { database } from "@/lib/database";
import * as schema from "@/lib/database/schema";
import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { KEY_PREFIX } from "@/lib/constants";
import { sendResetPasswordEmail } from "@/lib/email";

export const auth = betterAuth({
  appName: "assistant-ui demo",
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(database, {
    provider: "pg",
    schema: schema,
  }),
  secondaryStorage: {
    get: async (key: string) => {
      const value = await redis.get(`${KEY_PREFIX.auth}${key}`);
      return value;
    },
    set: async (key: string, value: string, ttl?: number) => {
      if (ttl) {
        await redis.set(`${KEY_PREFIX.auth}${key}`, value, { ex: ttl });
      } else {
        await redis.set(`${KEY_PREFIX.auth}${key}`, value);
      }
    },
    delete: async (key: string) => {
      await redis.del(`${KEY_PREFIX.auth}${key}`);
    },
  },
  account: {
    accountLinking: {
      trustedProviders: ["google"],
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      void sendResetPasswordEmail({
        to: user.email,
        url,
      });
    },
  },
  socialProviders: {
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
    storage: "secondary-storage",
    customRules: {
      "/sign-in/*": {
        window: 60,
        max: 5,
      },
      "/forget-password": {
        window: 60,
        max: 3,
      },
      "/reset-password": {
        window: 60,
        max: 5,
      },
    },
  },
  plugins: [organization(), twoFactor()],
});

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
