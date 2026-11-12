"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrigin } from "./use-origin";
import type { PayLink } from "@/lib/db/schema";
import { num, shortAddr } from "@/lib/format";
import { api } from "./api-client";
import { Button, Card, ErrorNote, Row, TxLink } from "./ui";
import { useAction, useWallet } from "./wallet";

type Check = { label: string; ok: boolean };
type Result = { ok: boolean; checks: Check[]; hash: string; reason?: string };

const CHECKED = ["Transaction succeeded", "Asset is real USDC", "Sent to the right wallet", "Exact amount", "Not reused for another link"];

export function PayLinkView({ link, ownerName, viewer }: { link: PayLink; ownerName: string; viewer: string | null }) {
  const router = useRouter();
  const { pickWallet, signXdr } = useWallet();
  const { busy, error, run, setError } = useAction();
  const [result, setResult] = useState<Result | null>(null);
  const [hash, setHash] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const origin = useOrigin();

  const pay = () =>
    run(async () => {
      const payer = await pickWallet();
      const prep = await api<{ xdr: string; intent: string }>(`/api/links/${link.id}/prepare`, { payer });
      const signedXdr = await signXdr(prep.xdr, payer);
      const res = await api<Result>(`/api/links/${link.id}/submit`, { intent: prep.intent, signedXdr });
      setResult(res);
      if (!res.ok) setError(res.reason || "Payment could not be verified");
      router.refresh();
    });

  const verify = () =>
    run(async () => {
      const res = await api<Result>(`/api/links/${link.id}/verify`, { txHash: hash.trim() });
      setResult(res);
      if (!res.ok) setError(res.reason || "That transaction doesn't match this link");
      router.refresh();
    });

  if (link.status === "PAID") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-2xl text-brand">✓</span>
          <h1 className="mt-3 text-2xl font-bold">Payment confirmed</h1>
          <span className="mt-2 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">Verified on Stellar, not a screenshot</span>
        </div>
        <Card className="p-4">
          <Row label="Amount">{num(link.amount)} USDC</Row>
          <Row label="For">{link.description}</Row>
          <Row label="From" mono>{shortAddr(link.payer)}</Row>
          <Row label="To" mono>{shortAddr(link.ownerAddress)} · {ownerName}</Row>
          {link.paidAt && <Row label="Paid">{new Date(link.paidAt).toLocaleString("en-GB")}</Row>}
          <div className="pt-1">
            <TxLink hash={link.txHash}>View on Stellar explorer</TxLink>
          </div>
        </Card>
        <div>
          <p className="text-sm font-semibold">What Circle checked before marking it paid</p>
          <ul className="mt-2 space-y-1">
            {(result?.checks?.length ? result.checks.map((c) => c.label) : CHECKED).map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-muted">
                <span className="text-brand">✓</span> {c}
              </li>
            ))}
          </ul>
        </div>
        {viewer === link.ownerAddress && (
          <Link href="/dashboard" className="block rounded-xl bg-brand py-3 text-center text-sm font-semibold text-white">Back to dashboard</Link>
        )}
      </div>
    );
  }

  const isOwner = viewer === link.ownerAddress;
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-muted">Pay {ownerName} for</p>
        <p className="font-semibold">{link.description}</p>
        <p className="mt-1 text-5xl font-bold tracking-tight">{num(link.amount)} USDC</p>
      </div>
      <Card className="p-4">
        <Row label="To" mono>{shortAddr(link.ownerAddress)}</Row>
        <Row label="Network">Stellar (fixed)</Row>
        <Row label="Asset">USDC (fixed)</Row>
        <Row label="Network fee">under 0.01 XLM</Row>
      </Card>
      <div className="flex gap-3 rounded-xl bg-brand-soft/60 p-3.5 text-sm">
        <span aria-hidden>🛡️</span>
        <span>Address, network and amount are fixed by the link, so nothing can be typed or pasted wrong.</span>
      </div>
      {isOwner && origin && (
        <Card className="p-4 text-sm">
          <p className="font-semibold">This is your link</p>
          <p className="mt-1 break-all font-mono text-xs text-muted">{origin}/pay/{link.id}</p>
        </Card>
      )}
      {result && !result.ok && result.checks.length > 0 && (
        <Card className="p-4">
          {result.checks.map((c) => (
            <p key={c.label} className="text-sm">{c.ok ? "✓" : "✗"} {c.label}</p>
          ))}
        </Card>
      )}
      <ErrorNote>{error}</ErrorNote>
      {!isOwner && (
        <>
          <Button full size="lg" busy={busy} onClick={pay}>Pay with wallet</Button>
          <p className="text-center text-xs text-muted">You&apos;ll confirm in your wallet before anything moves.</p>
        </>
      )}
      <div className="text-center">
        <button className="text-xs font-semibold text-muted hover:text-ink" onClick={() => setShowVerify((v) => !v)}>
          Already paid? Verify with the transaction hash
        </button>
        {showVerify && (
          <div className="mt-2 flex gap-2">
            <input className="input font-mono text-xs" placeholder="64-character transaction hash" value={hash} onChange={(e) => setHash(e.target.value)} />
            <Button variant="secondary" busy={busy} onClick={verify} disabled={!hash.trim()}>Verify</Button>
          </div>
        )}
      </div>
    </div>
  );
}
