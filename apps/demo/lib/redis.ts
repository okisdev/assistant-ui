import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

export const redis = new Redis({
  url: env.REDIS_API_URL,
  token: env.REDIS_API_TOKEN,
});
