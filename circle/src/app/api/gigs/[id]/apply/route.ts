import { eq } from "drizzle-orm";
import { HttpError, handle, json, requireAddress } from "@/lib/api";
import { applications, db, gigs } from "@/lib/db";
import { shortId } from "@/lib/ids";
import { applicationSchema, total } from "@/lib/validation";

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const address = await requireAddress();
  const { id } = await params;
  const gig = await db.query.gigs.findFirst({ where: eq(gigs.id, id) });
  if (!gig) throw new HttpError(404, "Gig not found");
  if (gig.status !== "OPEN") throw new HttpError(409, "This gig is no longer taking applications");
  if (gig.clientAddress === address) throw new HttpError(400, "You can't apply to your own gig");
  const data = applicationSchema.parse(await req.json());
  if (data.milestones.some((m) => m.receiver === gig.clientAddress))
    throw new HttpError(400, "The client's wallet can't be a team member");
  await db
    .insert(applications)
    .values({ id: shortId(8), gigId: id, leadAddress: address, ...data, total: total(data.milestones) })
    .onConflictDoUpdate({
      target: [applications.gigId, applications.leadAddress],
      set: { pitch: data.pitch, link: data.link, milestones: data.milestones, total: total(data.milestones) },
    });
  return json({ ok: true });
});
