import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, payLinks, type PayLink } from "./db";
import { HttpError } from "./errors";
import { verifyLinkPayment } from "./stellar-server";

/** Verify a transaction on Stellar and, only if every check passes, mark the link paid. */
export async function confirmLinkPayment(link: PayLink, hash: string) {
  if (link.status === "PAID") {
    if (link.txHash === hash) return { ok: true, checks: [], hash };
    throw new HttpError(409, "This link has already been paid");
  }
  const used = await db.query.payLinks.findFirst({ where: eq(payLinks.txHash, hash) });
  if (used) throw new HttpError(409, "This transaction was already used for another link");
  const result = await verifyLinkPayment(hash, link);
  if (!result.ok) return { ...result, hash };
  await db
    .update(payLinks)
    .set({ status: "PAID", txHash: hash, payer: result.payer ?? null, paidAt: new Date() })
    .where(and(eq(payLinks.id, link.id), eq(payLinks.status, "OPEN"), isNull(payLinks.txHash)));
  return { ...result, hash };
}
