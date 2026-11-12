import "server-only";
import { serverConfig } from "./server-config";

/**
 * Server-side client for the Trustless Work escrow API (multi-release escrows).
 *
 * Same endpoints the @trustless-work/escrow React SDK (v3) calls, but run on the
 * server so the API key never reaches the browser. Every write returns an
 * unsigned transaction: the right wallet signs it, then we send it.
 * If Trustless Work moves you to its v2 API, this is the only file to change.
 */

type Unsigned = { status: "SUCCESS" | "FAILED"; unsignedTransaction?: string; message?: string };

export type TWMilestone = {
  description: string;
  amount: number;
  receiver: string;
  status?: string;
  evidence?: string;
  flags?: { approved?: boolean; released?: boolean; disputed?: boolean; resolved?: boolean };
};

export type TWEscrow = {
  contractId?: string;
  engagementId: string;
  title: string;
  balance?: number;
  milestones: TWMilestone[];
  roles: Record<string, string>;
  platformFee: number;
};

export class TrustlessWorkError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

async function call<T>(method: "GET" | "POST" | "PUT", path: string, body?: unknown, query?: URLSearchParams): Promise<T> {
  const url = `${serverConfig.twApiUrl}${path}${query ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-api-key": serverConfig.twApiKey },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const d = data as { message?: string | string[]; detail?: string } | null;
    const msg = Array.isArray(d?.message) ? d!.message.join(", ") : d?.message || d?.detail || text || res.statusText;
    throw new TrustlessWorkError(`Trustless Work: ${msg}`, res.status >= 500 ? 502 : 400);
  }
  return data as T;
}

function unsigned(r: Unsigned): string {
  if (!r?.unsignedTransaction) throw new TrustlessWorkError(r?.message || "Trustless Work returned no transaction");
  return r.unsignedTransaction;
}

const MR = "multi-release";

export const tw = {
  deploy: async (p: {
    signer: string;
    engagementId: string;
    title: string;
    description: string;
    approver: string;
    serviceProvider: string;
    platformFee: number;
    milestones: { description: string; amount: number; receiver: string }[];
  }) =>
    unsigned(
      await call<Unsigned>("POST", `/deployer/${MR}`, {
        signer: p.signer,
        engagementId: p.engagementId,
        title: p.title,
        description: p.description || p.title,
        roles: {
          approver: p.approver,
          serviceProvider: p.serviceProvider,
          platformAddress: serverConfig.platformPublic,
          releaseSigner: serverConfig.platformPublic,
          disputeResolver: serverConfig.platformPublic,
        },
        platformFee: p.platformFee,
        milestones: p.milestones,
        trustline: { address: serverConfig.escrowTrustline },
      }),
    ),

  fund: async (p: { contractId: string; signer: string; amount: number }) =>
    unsigned(await call<Unsigned>("POST", `/escrow/${MR}/fund-escrow`, p)),

  markDone: async (p: { contractId: string; milestoneIndex: number; evidence: string; serviceProvider: string }) =>
    unsigned(
      await call<Unsigned>("POST", `/escrow/${MR}/change-milestone-status`, {
        contractId: p.contractId,
        milestoneIndex: String(p.milestoneIndex),
        newStatus: "Completed",
        newEvidence: p.evidence,
        serviceProvider: p.serviceProvider,
      }),
    ),

  approve: async (p: { contractId: string; milestoneIndex: number; approver: string }) =>
    unsigned(
      await call<Unsigned>("POST", `/escrow/${MR}/approve-milestone`, {
        contractId: p.contractId,
        milestoneIndex: String(p.milestoneIndex),
        approver: p.approver,
      }),
    ),

  release: async (p: { contractId: string; milestoneIndex: number }) =>
    unsigned(
      await call<Unsigned>("POST", `/escrow/${MR}/release-milestone-funds`, {
        contractId: p.contractId,
        milestoneIndex: String(p.milestoneIndex),
        releaseSigner: serverConfig.platformPublic,
      }),
    ),

  dispute: async (p: { contractId: string; milestoneIndex: number; signer: string }) =>
    unsigned(
      await call<Unsigned>("POST", `/escrow/${MR}/dispute-milestone`, {
        contractId: p.contractId,
        milestoneIndex: String(p.milestoneIndex),
        signer: p.signer,
      }),
    ),

  resolve: async (p: { contractId: string; milestoneIndex: number; distributions: { address: string; amount: number }[] }) =>
    unsigned(
      await call<Unsigned>("POST", `/escrow/${MR}/resolve-milestone-dispute`, {
        contractId: p.contractId,
        milestoneIndex: String(p.milestoneIndex),
        disputeResolver: serverConfig.platformPublic,
        distributions: p.distributions,
      }),
    ),

  /** Submits a signed transaction. For a deploy, the response carries the new contractId. */
  send: (signedXdr: string) =>
    call<{ status: "SUCCESS" | "FAILED"; message?: string; contractId?: string }>("POST", `/helper/send-transaction`, {
      signedXdr,
    }),

  getEscrow: async (contractId: string): Promise<TWEscrow | null> => {
    const q = new URLSearchParams();
    q.append("contractIds[]", contractId);
    q.append("validateOnChain", "true");
    const list = await call<TWEscrow[]>("GET", `/helper/get-escrow-by-contract-ids`, undefined, q);
    return Array.isArray(list) && list.length ? list[0] : null;
  },
};
