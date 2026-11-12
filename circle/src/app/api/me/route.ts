import { eq } from "drizzle-orm";
import { handle, json } from "@/lib/api";
import { db, users } from "@/lib/db";
import { isAdmin } from "@/lib/server-config";
import { getSessionAddress } from "@/lib/session";

export const GET = handle(async () => {
  const address = await getSessionAddress();
  if (!address) return json({ address: null, user: null, admin: false });
  const user = await db.query.users.findFirst({ where: eq(users.address, address) });
  return json({ address, user: user ?? null, admin: isAdmin(address) });
});
