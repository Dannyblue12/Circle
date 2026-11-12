import "server-only";
import {
  Asset,
  FeeBumpTransaction,
  Keypair,
  Memo,
  Operation,
  Transaction,
  TransactionBuilder,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import { HORIZON_URL, NETWORK_PASSPHRASE, RPC_URL, USDC_ISSUER } from "./config";
import { serverConfig } from "./server-config";

export const USDC = new Asset("USDC", USDC_ISSUER);
export const rpcServer = () => new rpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });

export function parseTx(envelope: Parameters<typeof TransactionBuilder.fromXDR>[0]): Transaction {
  const t = TransactionBuilder.fromXDR(envelope, NETWORK_PASSPHRASE);
  return t instanceof FeeBumpTransaction ? t.innerTransaction : t;
}

/** Hash of the transaction body. Signatures don't change it, so it binds a signed tx to the one we built. */
export function txHash(xdrString: string): string {
  return Buffer.from(TransactionBuilder.fromXDR(xdrString, NETWORK_PASSPHRASE).hash()).toString("hex");
}

/** Sign with the Platform account (release signer + dispute resolver). Server only. */
export function signAsPlatform(unsignedXdr: string): string {
  const tx = TransactionBuilder.fromXDR(unsignedXdr, NETWORK_PASSPHRASE);
  tx.sign(Keypair.fromSecret(serverConfig.platformSecret));
  return tx.toXDR();
}

/** Fallback for finding a new escrow's contract id from the deploy transaction's return value. */
export async function contractIdFromTx(hash: string): Promise<string | null> {
  try {
    const res = await pollTransaction(hash, 20);
    if (res.status !== rpc.Api.GetTransactionStatus.SUCCESS || !res.returnValue) return null;
    const native = scValToNative(res.returnValue);
    const flat = Array.isArray(native) ? native.flat(3) : [native];
    const found = flat.find((v) => typeof v === "string" && /^C[A-Z2-7]{55}$/.test(v));
    return (found as string) ?? null;
  } catch {
    return null;
  }
}

export async function pollTransaction(hash: string, seconds = 30) {
  const server = rpcServer();
  for (let i = 0; i < seconds; i++) {
    const res = await server.getTransaction(hash);
    if (res.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) return res;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { status: rpc.Api.GetTransactionStatus.NOT_FOUND } as rpc.Api.GetTransactionResponse;
}

/** Quick pay: a plain USDC payment with the link id as memo. Destination, asset and amount are fixed here. */
export async function buildLinkPayment(p: { payer: string; destination: string; amount: number; memo: string }) {
  const account = await rpcServer().getAccount(p.payer);
  const tx = new TransactionBuilder(account, { fee: "1000", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.payment({ destination: p.destination, asset: USDC, amount: p.amount.toFixed(7) }))
    .addMemo(Memo.text(p.memo))
    .setTimeout(300)
    .build();
  return tx.toXDR();
}

export async function submitClassic(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sent = await rpcServer().sendTransaction(tx);
  if (sent.status === "ERROR") throw new Error("Stellar rejected the transaction (check your USDC balance and trustline)");
  if (sent.status === "TRY_AGAIN_LATER") throw new Error("Network is busy, try again in a moment");
  return sent.hash;
}

export type PaymentCheck = { label: string; ok: boolean };

/**
 * The quick-pay receipt rule: a payment only counts once Stellar confirms it.
 * Checks: succeeded, real USDC (right issuer), right destination, exact amount,
 * memo matches this link (so a tx can't be reused for another link).
 */
export async function verifyLinkPayment(
  hash: string,
  link: { id: string; ownerAddress: string; amount: number },
): Promise<{ ok: boolean; checks: PaymentCheck[]; payer?: string; reason?: string }> {
  const res = await pollTransaction(hash, 25);
  const checks: PaymentCheck[] = [];
  if (res.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    return { ok: false, checks, reason: "Transaction not found on Stellar yet. Try verifying again in a few seconds." };
  }
  const succeeded = res.status === rpc.Api.GetTransactionStatus.SUCCESS;
  checks.push({ label: "Transaction succeeded", ok: succeeded });
  if (!succeeded) return { ok: false, checks, reason: "The transaction failed on Stellar" };

  const tx = parseTx(res.envelopeXdr);
  return checkLinkPayment(tx, link, checks);
}

/** Pure check of a confirmed transaction against a pay link (kept separate so it can be tested offline). */
export function checkLinkPayment(
  tx: Transaction,
  link: { id: string; ownerAddress: string; amount: number },
  checks: PaymentCheck[] = [{ label: "Transaction succeeded", ok: true }],
): { ok: boolean; checks: PaymentCheck[]; payer?: string; reason?: string } {
  const payments = tx.operations.filter((op) => op.type === "payment") as Operation.Payment[];
  const pay = payments.find((op) => op.destination === link.ownerAddress) ?? payments[0];

  const isUsdc = !!pay && !pay.asset.isNative() && pay.asset.getCode() === "USDC" && pay.asset.getIssuer() === USDC_ISSUER;
  checks.push({ label: "Asset is real USDC", ok: isUsdc });
  checks.push({ label: "Sent to the right wallet", ok: !!pay && pay.destination === link.ownerAddress });
  checks.push({ label: "Exact amount", ok: !!pay && Number(pay.amount).toFixed(7) === link.amount.toFixed(7) });
  const v = tx.memo.value as unknown;
  const memo = v == null ? "" : typeof v === "string" ? v : Buffer.from(v as Uint8Array).toString("utf8");
  checks.push({ label: "Made for this link (memo)", ok: tx.memo.type === "text" && memo === link.id });

  const ok = checks.every((c) => c.ok);
  return { ok, checks, payer: pay?.source || tx.source, reason: ok ? undefined : "This transaction doesn't match the link" };
}

export type Balances = { usdc: number; xlm: number; exists: boolean; usdcTrustline: boolean };

/** Horizon balances. Returns null if the network can't be reached (so we never show a false warning). */
export async function getBalances(address: string): Promise<Balances | null> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${address}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.status === 404) return { usdc: 0, xlm: 0, exists: false, usdcTrustline: false };
    const data = (await res.json()) as {
      balances: { asset_type: string; asset_code?: string; asset_issuer?: string; balance: string }[];
    };
    const u = data.balances.find((b) => b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER);
    const x = data.balances.find((b) => b.asset_type === "native");
    return { usdc: Number(u?.balance ?? 0), xlm: Number(x?.balance ?? 0), exists: true, usdcTrustline: !!u };
  } catch {
    return null;
  }
}
