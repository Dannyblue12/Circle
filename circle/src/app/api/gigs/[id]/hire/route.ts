import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { HttpError, handle, json, requireAddress } from "@/lib/api";
import { applications, db, gigs, milestones, projects } from "@/lib/db";
import { shortId } from "@/lib/ids";
import { serverConfig } from "@/lib/server-config";

/** The client picks an application. Its milestones (one per team member) become the escrow's milestones. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const address = await requireAddress();
  const { id } = await params;
  const { applicationId } = z.object({ applicationId: z.string() }).parse(await req.json());
  const gig = await db.query.gigs.findFirst({ where: eq(gigs.id, id) });
  if (!gig) throw new HttpError(404, "Gig not found");
  if (gig.clientAddress !== address) throw new HttpError(403, "Only the person who posted this gig can hire");
  if (gig.status !== "OPEN") throw new HttpError(409, "Someone has already been hired for this gig");
  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.gigId, id)),
  });
  if (!app) throw new HttpError(404, "Application not found");

  const projectId = shortId(8);
  await db.batch([
    db.insert(projects).values({
      id: projectId,
      title: gig.title,
      description: gig.description.slice(0, 500),
      clientAddress: gig.clientAddress,
      leadAddress: app.leadAddress,
      gigId: gig.id,
      total: app.total,
      platformFeePct: serverConfig.platformFeePercent,
    }),
    db.insert(milestones).values(
      app.milestones.map((m, idx) => ({ id: shortId(12), projectId, idx, ...m })),
    ),
    db.update(gigs).set({ status: "HIRED", projectId }).where(eq(gigs.id, gig.id)),
    db.update(applications).set({ status: "HIRED" }).where(eq(applications.id, app.id)),
    db
      .update(applications)
      .set({ status: "REJECTED" })
      .where(and(eq(applications.gigId, gig.id), ne(applications.id, app.id))),
  ]);
  return json({ projectId });
});
