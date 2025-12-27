import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { env } from "@/lib/env";

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const database = drizzle({ client: pool });
