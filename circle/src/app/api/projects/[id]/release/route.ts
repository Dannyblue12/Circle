import { z } from "zod";
import { HttpError, handle, json, requireAddress } from "@/lib/api";
import { loadProject, releaseMilestone } from "@/lib/escrow";

/** Retry for an automatic release that didn't go through. Safe: it re-checks the escrow on Stellar. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const address = await requireAddress();
  const { id } = await params;
  const { idx } = z.object({ idx: z.coerce.number().int().min(0) }).parse(await req.json());
  const p = await loadProject(id);
  const involved = [p.clientAddress, p.leadAddress, ...p.milestones.map((m) => m.receiver)];
  if (!involved.includes(address)) throw new HttpError(403, "You're not part of this project");
  return json({ releaseTx: await releaseMilestone(id, idx) });
});
