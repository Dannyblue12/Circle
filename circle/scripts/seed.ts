/**
 * Demo marketplace data (see scripts/demo.ts for what gets created).
 * The app also seeds it automatically on an empty database unless DEMO_DATA="false".
 *
 *   npm run seed                 add demo data (skips if it's already there)
 *   npm run seed -- --reset      remove the demo data and add a fresh set
 *   npm run seed -- --remove     remove the demo data (your real gigs and profiles stay)
 */
import { config } from "dotenv";
config({ quiet: true });
import { existsSync, readFileSync, writeFileSync } from "fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/schema";
import { hasDemoData, removeDemo, seedDemo } from "./demo";

const db = drizzle(createClient({ url: process.env.DATABASE_URL || "file:./dev.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined }), { schema });
const flags = new Set(process.argv.slice(2));

/** Remembers the choice in .env, so `npm run dev` doesn't re-add demo data you removed (or skip data you asked for). */
function setAutoDemo(on: boolean) {
  const path = ".env";
  if (!existsSync(path) || process.env.VERCEL || process.env.CI) return;
  const env = readFileSync(path, "utf8");
  const line = `DEMO_DATA="${on}"`;
  const next = /^DEMO_DATA=.*$/m.test(env) ? env.replace(/^DEMO_DATA=.*$/m, line) : `${env.trimEnd()}\n${line}\n`;
  if (next === env || (on && !/^DEMO_DATA=/m.test(env))) return;
  writeFileSync(path, next);
  console.log(`Set ${line} in .env${on ? "" : " so it isn't added again on the next start"}.`);
}

async function main() {
  const reset = flags.has("--reset") || flags.has("--force");
  if (flags.has("--remove") || reset) {
    const r = await removeDemo(db);
    console.log(`Removed demo data: ${r.gigs} gigs, ${r.people} profiles, ${r.applications} applications.`);
    if (!reset) return setAutoDemo(false);
  } else if (await hasDemoData(db)) {
    setAutoDemo(true);
    console.log("Demo data is already there. Use `npm run seed -- --reset` for a fresh set, or `-- --remove` to delete it.");
    return;
  }
  const s = await seedDemo(db);
  setAutoDemo(true);
  console.log(`Seeded ${s.people} demo profiles, ${s.gigs} gigs and ${s.applications} applications.`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
