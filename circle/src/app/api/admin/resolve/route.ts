import { z } from "zod";
import { HttpError, handle, json, requireAddress } from "@/lib/api";
import { resolveDispute } from "@/lib/escrow";
import { isAdmin } from "@/lib/server-config";

export const POST = handle(async (req: Request) => {
  const address = await requireAddress();
  if (!isAdmin(address)) throw new HttpError(403, "Only Circle admins can resolve disputes");
  const body = z
    .object({ projectId: z.string(), idx: z.coerce.number().int().min(0), toReceiverPct: z.coerce.number().min(0).max(100) })
    .parse(await req.json());
  return json(await resolveDispute(body.projectId, body.idx, body.toReceiverPct));
});
