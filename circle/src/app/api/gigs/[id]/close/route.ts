import { eq } from "drizzle-orm";
import { HttpError, handle, json, requireAddress } from "@/lib/api";
import { db, gigs } from "@/lib/db";

export const POST = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const address = await requireAddress();
  const { id } = await params;
  const gig = await db.query.gigs.findFirst({ where: eq(gigs.id, id) });
  if (!gig) throw new HttpError(404, "Gig not found");
  if (gig.clientAddress !== address) throw new HttpError(403, "Not your gig");
  if (gig.status !== "OPEN") throw new HttpError(409, "Only open gigs can be closed");
  await db.update(gigs).set({ status: "CLOSED" }).where(eq(gigs.id, id));
  return json({ ok: true });
});
