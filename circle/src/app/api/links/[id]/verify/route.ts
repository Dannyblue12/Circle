import { eq } from "drizzle-orm";
import { z } from "zod";
import { HttpError, handle, json } from "@/lib/api";
import { db, payLinks } from "@/lib/db";
import { confirmLinkPayment } from "@/lib/links";

/** Re-check a payment by hash (e.g. if the page closed before Stellar confirmed it). */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { txHash } = z.object({ txHash: z.string().regex(/^[0-9a-f]{64}$/i, "Paste a 64-character transaction hash") }).parse(await req.json());
  const link = await db.query.payLinks.findFirst({ where: eq(payLinks.id, id) });
  if (!link) throw new HttpError(404, "Link not found");
  return json(await confirmLinkPayment(link, txHash.toLowerCase()));
});
