import "server-only";
import { randomBytes } from "crypto";
import { Account, Keypair, Operation, TransactionBuilder, Transaction, FeeBumpTransaction } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "./config";

const DATA_NAME = "circle auth";

/**
 * Sign-in works like SEP-10: we build a transaction that can never be submitted
 * (sequence 0, 5-minute window) with a random nonce, the wallet signs it, and we
 * check the signature. The wallet's key never leaves the wallet.
 */
export function buildChallenge(address: string) {
  const nonce = randomBytes(16).toString("hex"); // 32 chars, fits a manageData value
  const account = new Account(address, "-1"); // builder bumps to sequence 0
  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.manageData({ name: DATA_NAME, value: nonce }))
    .setTimeout(300)
    .build();
  return { xdr: tx.toXDR(), nonce };
}

export function verifyChallenge(signedXdr: string, address: string, nonce: string): string | null {
  let parsed: Transaction | FeeBumpTransaction;
  try {
    parsed = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  } catch {
    return "Could not read the signed transaction";
  }
  if (parsed instanceof FeeBumpTransaction) return "Unexpected transaction type";
  const tx = parsed;
  if (tx.source !== address) return "Signed by a different account";
  if (tx.sequence !== "0") return "Invalid challenge";
  if (tx.operations.length !== 1) return "Invalid challenge";
  const op = tx.operations[0];
  if (op.type !== "manageData" || op.name !== DATA_NAME || (op.value ? Buffer.from(op.value).toString("utf8") : "") !== nonce) return "Invalid challenge";
  const maxTime = Number(tx.timeBounds?.maxTime ?? 0);
  if (!maxTime || maxTime * 1000 < Date.now()) return "Challenge expired, try again";

  const kp = Keypair.fromPublicKey(address);
  const hash = tx.hash();
  const ok = tx.signatures.some((s) => {
    try {
      return kp.verify(hash, s.signature);
    } catch {
      return false;
    }
  });
  return ok ? null : "Signature does not match this wallet";
}
