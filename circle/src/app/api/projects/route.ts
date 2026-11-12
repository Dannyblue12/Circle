import { HttpError, handle, json, requireAddress } from "@/lib/api";
import { db, milestones, projects } from "@/lib/db";
import { shortId } from "@/lib/ids";
import { serverConfig } from "@/lib/server-config";
import { projectSchema, total } from "@/lib/validation";

/** Direct project for a client found off-platform (WhatsApp, X, referrals). The lead sends them the link. */
export const POST = handle(async (req: Request) => {
  const address = await requireAddress();
  const data = projectSchema.parse(await req.json());
  if (data.clientAddress === address) throw new HttpError(400, "The client wallet must be different from yours");
  if (data.milestones.some((m) => m.receiver === data.clientAddress))
    throw new HttpError(400, "The client's wallet can't be a team member");
  const id = shortId(8);
  await db.batch([
    db.insert(projects).values({
      id,
      title: data.title,
      description: data.description,
      clientAddress: data.clientAddress,
      leadAddress: address,
      total: total(data.milestones),
      platformFeePct: serverConfig.platformFeePercent,
    }),
    db.insert(milestones).values(data.milestones.map((m, idx) => ({ id: shortId(12), projectId: id, idx, ...m }))),
  ]);
  return json({ id });
});
