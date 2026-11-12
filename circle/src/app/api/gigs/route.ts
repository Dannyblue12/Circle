import { handle, json, requireAddress } from "@/lib/api";
import { db, gigs } from "@/lib/db";
import { shortId } from "@/lib/ids";
import { gigSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const address = await requireAddress();
  const data = gigSchema.parse(await req.json());
  const id = shortId(8);
  await db.insert(gigs).values({ id, clientAddress: address, ...data });
  return json({ id });
});
