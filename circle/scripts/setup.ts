/**
 * Runs automatically before `npm run dev`, `npm run build` and `npm start`.
 *  1. Creates .env from .env.example on first run (with a random SESSION_SECRET).
 *  2. Creates or updates the database tables (safe to run every time).
 *  3. Tells you which settings are still missing for the on-chain features.
 */
import { existsSync, copyFileSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const root = process.cwd();
const envPath = join(root, ".env");
const inCI = !!(process.env.VERCEL || process.env.CI);

// 1. .env
if (!inCI) {
  if (!existsSync(envPath)) {
    copyFileSync(join(root, ".env.example"), envPath);
    console.log("• Created .env from .env.example");
  }
  const env = readFileSync(envPath, "utf8");
  if (/^SESSION_SECRET=""\s*$/m.test(env) || !/^SESSION_SECRET=/m.test(env)) {
    const secret = randomBytes(32).toString("hex");
    const next = /^SESSION_SECRET=/m.test(env)
      ? env.replace(/^SESSION_SECRET=""\s*$/m, `SESSION_SECRET="${secret}"`)
      : `${env.trimEnd()}\nSESSION_SECRET="${secret}"\n`;
    writeFileSync(envPath, next);
    console.log("• Generated SESSION_SECRET in .env");
  }
}

async function main() {
  const { config } = await import("dotenv");
  config({ path: envPath, quiet: true });

  // 2. Database
  const { createClient } = await import("@libsql/client");
  const { drizzle } = await import("drizzle-orm/libsql");
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  const url = process.env.DATABASE_URL || "file:./dev.db";
  if (inCI && url.startsWith("file:")) {
    console.warn("⚠ DATABASE_URL is a local file. On Vercel, set it to a Turso database (libsql://…) or data won't persist.");
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  await migrate(drizzle(client), { migrationsFolder: join(root, "drizzle") });
  console.log(`• Database ready (${url.startsWith("file:") ? url.replace("file:", "") : url.split("@").pop()})`);

  // Demo gigs, so a fresh install or deploy doesn't open on an empty marketplace.
  if (process.env.DEMO_DATA !== "false") {
    const schema = await import("../src/lib/db/schema");
    const demo = await import("./demo");
    const db = drizzle(client, { schema });
    try {
      if (!(await demo.hasGigs(db))) {
        const s = await demo.seedDemo(db);
        console.log(`• Added ${s.gigs} demo gigs and ${s.people} sample profiles (remove with: npm run seed -- --remove, or set DEMO_DATA="false")`);
      } else {
        const days = await demo.refreshDemoDates(db);
        if (days) console.log(`• Moved demo gig dates forward ${days} day${days === 1 ? "" : "s"} so they look current`);
      }
    } catch (e) {
      // Demo data is a nicety: never block the app from starting because of it.
      console.warn("⚠ Couldn't add demo gigs:", e instanceof Error ? e.message : e);
    }
  }
  client.close();

  // 3. What's still missing
  const missing = [
    ["TRUSTLESS_WORK_API_KEY", "escrows"],
    ["PLATFORM_PUBLIC_KEY", "escrows"],
    ["PLATFORM_SECRET_KEY", "releases and disputes"],
  ].filter(([k]) => !process.env[k]);
  if (missing.length) {
    console.log(
      `• Marketplace works now. For on-chain escrow, still set: ${missing.map(([k]) => k).join(", ")}` +
        (missing.some(([k]) => k.startsWith("PLATFORM")) ? " (run: npm run setup:platform)" : ""),
    );
  }
  if (!process.env.ADMIN_ADDRESSES) console.log("• Set ADMIN_ADDRESSES to your wallet to resolve disputes at /admin");
}

main().catch((e) => {
  console.error("✖ Setup failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
