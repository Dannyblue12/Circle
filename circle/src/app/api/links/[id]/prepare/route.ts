import { eq } from "drizzle-orm";
import { z } from "zod";
import { HttpError, handle, json } from "@/lib/api";
import { db, payLinks } from "@/lib/db";
import { makeIntent } from "@/lib/intent";
import { buildLinkPayment } from "@/lib/stellar-server";

/** Builds the payment server-side: recipient, network, asset, amount and memo all come from the link. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { payer } = z.object({ payer: z.string().regex(/^G[A-Z2-7]{55}$/) }).parse(await req.json());
  const link = await db.query.payLinks.findFirst({ where: eq(payLinks.id, id) });
  if (!link) throw new HttpError(404, "Link not found");
  if (link.status === "PAID") throw new HttpError(409, "This link has already been paid");
  if (payer === link.ownerAddress) throw new HttpError(400, "You can't pay your own link");
  let xdr: string;
  try {
    xdr = await buildLinkPayment({ payer, destination: link.ownerAddress, amount: link.amount, memo: link.id });
  } catch {
    throw new HttpError(400, "Couldn't load your wallet on Stellar testnet. Fund it with Friendbot and add a USDC trustline.");
  }
  return json(makeIntent({ kind: "pay", linkId: id, signer: payer }, xdr));
});
