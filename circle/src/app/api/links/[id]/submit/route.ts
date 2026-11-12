import { eq } from "drizzle-orm";
import { HttpError, handle, json } from "@/lib/api";
import { db, payLinks } from "@/lib/db";
import { readIntent } from "@/lib/intent";
import { confirmLinkPayment } from "@/lib/links";
import { submitClassic } from "@/lib/stellar-server";
import { submitSchema } from "@/lib/validation";

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { intent, signedXdr } = submitSchema.parse(await req.json());
  const parsed = readIntent(intent, signedXdr, null);
  if (parsed.kind !== "pay" || parsed.linkId !== id) throw new HttpError(400, "This payment is for a different link");
  const link = await db.query.payLinks.findFirst({ where: eq(payLinks.id, id) });
  if (!link) throw new HttpError(404, "Link not found");
  if (link.status === "PAID") throw new HttpError(409, "This link has already been paid");
  let hash: string;
  try {
    hash = await submitClassic(signedXdr);
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : "Stellar rejected the payment");
  }
  return json(await confirmLinkPayment(link, hash));
});
