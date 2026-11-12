import { handle, json, requireAddress } from "@/lib/api";
import { db, users } from "@/lib/db";
import { profileSchema } from "@/lib/validation";

export const PUT = handle(async (req: Request) => {
  const address = await requireAddress();
  const data = profileSchema.parse(await req.json());
  await db.insert(users).values({ address, ...data }).onConflictDoUpdate({ target: users.address, set: data });
  return json({ ok: true });
});
