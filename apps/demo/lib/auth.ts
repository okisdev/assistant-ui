import { database } from "@/database";
import { env } from "@/lib/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(database, {
    provider: "pg",
  }),
});
