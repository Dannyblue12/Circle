import type { Config } from "drizzle-kit";
import { config } from "dotenv";
config();

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
} satisfies Config;
