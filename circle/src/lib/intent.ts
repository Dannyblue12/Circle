import "server-only";
import { readPayload, signPayload } from "./signed";
import { txHash } from "./stellar-server";
import { HttpError } from "./errors";

/**
 * When we hand a user an unsigned transaction we also hand them an "intent":
 * a signed note saying what the transaction does (fund, approve, …) and its hash.
 * On submit, the signed transaction must hash to the same value, so nobody can
 * swap in a different transaction and have us record the wrong action.
 */
export type Intent =
  | { kind: "deploy"; projectId: string; signer: string }
  | { kind: "fund"; projectId: string; signer: string }
  | { kind: "done"; projectId: string; idx: number; signer: string; evidence: string }
  | { kind: "approve"; projectId: string; idx: number; signer: string }
  | { kind: "dispute"; projectId: string; idx: number; signer: string; reason: string }
  | { kind: "pay"; linkId: string; signer: string };

export function makeIntent(intent: Intent, unsignedXdr: string) {
  return { xdr: unsignedXdr, intent: signPayload({ ...intent, h: txHash(unsignedXdr) }, 10 * 60 * 1000) };
}

export function readIntent(token: string, signedXdr: string, sessionAddress: string | null): Intent {
  const data = readPayload<Intent & { h: string }>(token);
  if (!data) throw new HttpError(400, "This request expired. Please try again.");
  // Pay links need no sign-in: the payment itself is signed by the payer's wallet.
  if (data.kind !== "pay" && data.signer !== sessionAddress) throw new HttpError(403, "This action belongs to a different wallet");
  let hash: string;
  try {
    hash = txHash(signedXdr);
  } catch {
    throw new HttpError(400, "Could not read the signed transaction");
  }
  if (hash !== data.h) throw new HttpError(400, "The signed transaction doesn't match the one we prepared");
  return data;
}
