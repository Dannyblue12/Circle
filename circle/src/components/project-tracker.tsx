"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrigin } from "./use-origin";
import type { Milestone, Project } from "@/lib/db/schema";
import { PROTOCOL_FEE_PERCENT, explorer } from "@/lib/config";
import { afterFees, num, shortAddr } from "@/lib/format";
import { api } from "./api-client";
import { Badge, Button, Card, ErrorNote, Row, TxLink, cx } from "./ui";
import { useAction, useWallet } from "./wallet";

type Props = {
  project: Project & { milestones: Milestone[] };
  clientName: string;
  leadName: string;
  viewer: string | null;
  clientUsdc: number | null;
  missingTrustline: string[];
};

type Role = "client" | "lead" | "member" | "viewer";

const STATUS: Record<Milestone["status"], { label: string; tone: "gray" | "blue" | "amber" | "green" | "red" }> = {
  PENDING: { label: "In progress", tone: "blue" },
  DONE: { label: "Awaiting approval", tone: "amber" },
  APPROVED: { label: "Approved · releasing", tone: "amber" },
  RELEASED: { label: "Released", tone: "green" },
  DISPUTED: { label: "In dispute", tone: "red" },
  RESOLVED: { label: "Resolved", tone: "gray" },
};

export function ProjectTracker({ project, clientName, leadName, viewer, clientUsdc, missingTrustline }: Props) {
  const router = useRouter();
  const { signXdr, connect } = useWallet();
  const { busy, error, run } = useAction();
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const p = project;
  const role: Role =
    viewer === p.clientAddress ? "client" : viewer === p.leadAddress ? "lead" : p.milestones.some((m) => m.receiver === viewer) ? "member" : "viewer";
  const settled = p.milestones.every((m) => m.status === "RELEASED" || m.status === "RESOLVED");
  const feePct = p.platformFeePct + PROTOCOL_FEE_PERCENT;

  async function act(key: string, action: string, extra: Record<string, unknown> = {}) {
    setPending(key);
    setNotice(null);
    await run(async () => {
      const prep = await api<{ xdr: string; intent: string }>(`/api/projects/${p.id}/prepare`, { action, ...extra });
      const signedXdr = await signXdr(prep.xdr, viewer);
      const res = await api<{ releaseError?: string; releaseTx?: string }>("/api/escrow/submit", { intent: prep.intent, signedXdr });
      if (res.releaseError) setNotice(`Approved on Stellar. The automatic release didn't finish: ${res.releaseError}`);
      router.refresh();
    });
    setPending(null);
  }

  async function retryRelease(idx: number) {
    setPending(`release-${idx}`);
    setNotice(null);
    await run(async () => {
      await api(`/api/projects/${p.id}/release`, { idx });
      router.refresh();
    });
    setPending(null);
  }

  const steps = [
    { label: "Created", done: !!p.contractId },
    { label: "Funded", done: p.funded },
    { label: "Work", done: p.milestones.some((m) => m.status !== "PENDING") },
    { label: "Approved", done: p.milestones.some((m) => ["APPROVED", "RELEASED"].includes(m.status)) },
    { label: "Released", done: settled && p.funded },
  ];

  if (p.funded && settled) return <EveryonePaid project={p} feePct={feePct} />;

  return (
    <div className="space-y-5">
      {/* Locked amount + progress */}
      <Card className={cx("p-5", p.funded ? "border-brand bg-brand text-white" : "")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cx("text-sm", p.funded ? "text-white/80" : "text-muted")}>{p.funded ? "Locked in escrow" : "Total client pays"}</p>
            <p className="text-3xl font-bold tracking-tight">{num(p.total)} USDC</p>
          </div>
          {p.funded ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand">Funded ✓</span>
          ) : p.contractId ? (
            <Badge tone="amber">Awaiting funding</Badge>
          ) : (
            <Badge tone="gray">Escrow not created</Badge>
          )}
        </div>
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {steps.map((s) => (
            <div key={s.label}>
              <div className={cx("h-1.5 rounded-full", s.done ? (p.funded ? "bg-white" : "bg-brand") : p.funded ? "bg-white/30" : "bg-line")} />
              <p className={cx("mt-1 text-[11px]", p.funded ? "text-white/80" : "text-muted")}>{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {missingTrustline.length > 0 && !p.funded && (
        <p className="rounded-xl bg-amber-soft px-3.5 py-2.5 text-sm text-amber-ink">
          {missingTrustline.join(", ")} {missingTrustline.length === 1 ? "has" : "have"} no USDC trustline yet. They must add one in their wallet before their share can be released.
        </p>
      )}

      {/* Step 1: create escrow */}
      {!p.contractId && (
        <Card className="p-5">
          <p className="font-semibold">Create the escrow on Stellar</p>
          <p className="mt-1 text-sm text-muted">
            This deploys a Trustless Work escrow contract with one milestone per person. Nobody can move the money except as the contract allows.
          </p>
          <div className="mt-4">
            {role === "client" || role === "lead" ? (
              <Button full size="lg" busy={busy && pending === "deploy"} disabled={busy} onClick={() => act("deploy", "deploy")}>
                Create escrow · sign in wallet
              </Button>
            ) : (
              <ConnectHint viewer={viewer} who="the client or the team lead" onConnect={() => run(connect)} />
            )}
          </div>
        </Card>
      )}

      {/* Step 2: fund */}
      {p.contractId && !p.funded &&
        (role === "client" ? (
          <Card className="space-y-4 p-5">
            <p className="font-semibold">{leadName}&apos;s team invited you to fund this project</p>
            <div className="flex gap-3 rounded-xl bg-brand-soft/60 p-3.5 text-sm">
              <span aria-hidden>🔒</span>
              <span>Your USDC is locked in an escrow contract, not sent to anyone. Each share is released only after you approve that milestone.</span>
            </div>
            <div>
              <Row label="Network">Stellar (fixed)</Row>
              <Row label="Asset">USDC (fixed)</Row>
              <Row label="Your wallet" mono>{shortAddr(p.clientAddress)}</Row>
              {clientUsdc !== null && <Row label="Your USDC balance">{num(clientUsdc)} USDC</Row>}
            </div>
            {clientUsdc !== null && clientUsdc < p.total && (
              <p className="text-sm text-amber-ink">You need {num(p.total - clientUsdc)} more USDC in this wallet.</p>
            )}
            <Button full size="lg" busy={busy && pending === "fund"} disabled={busy} onClick={() => act("fund", "fund")}>
              Lock {num(p.total)} USDC
            </Button>
            <p className="text-center text-xs text-muted">You&apos;ll approve this in your wallet before anything moves.</p>
          </Card>
        ) : (
          <ShareCard project={p} viewer={viewer} onConnect={() => run(connect)} />
        ))}

      {notice && <p className="rounded-xl bg-amber-soft px-3.5 py-2.5 text-sm text-amber-ink">{notice}</p>}
      <ErrorNote>{error}</ErrorNote>

      {/* Milestones */}
      <div className="space-y-3">
        {p.milestones.map((m) => (
          <MilestoneCard
            key={m.id}
            m={m}
            role={role}
            funded={p.funded}
            feePct={feePct}
            busy={busy}
            pending={pending}
            act={act}
            retryRelease={retryRelease}
            viewer={viewer}
          />
        ))}
      </div>

      <Card className="p-4">
        <Row label="Total client pays">{num(p.total)} USDC</Row>
        <p className="text-xs text-muted">
          Circle fee ({p.platformFeePct}%) + Trustless Work protocol fee ({PROTOCOL_FEE_PERCENT}%) are taken on-chain at release. Releases and disputes are handled by Circle&apos;s Platform account.
        </p>
        <div className="mt-2 border-t border-line pt-2">
          <Row label="Client">{clientName}</Row>
          <Row label="Team lead">{leadName}</Row>
          {p.contractId && (
            <Row label="Escrow contract" mono>
              <a href={explorer.contract(p.contractId)} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                {shortAddr(p.contractId, 6)} ↗
              </a>
            </Row>
          )}
          {p.fundTx && (
            <Row label="Funding">
              <TxLink hash={p.fundTx} />
            </Row>
          )}
        </div>
      </Card>
      {p.funded && <p className="text-center text-xs text-muted">After the client approves, Circle releases that share automatically. Status is checked against the escrow on Stellar.</p>}
    </div>
  );
}

function MilestoneCard({
  m,
  role,
  funded,
  feePct,
  busy,
  pending,
  act,
  retryRelease,
  viewer,
}: {
  m: Milestone;
  role: Role;
  funded: boolean;
  feePct: number;
  busy: boolean;
  pending: string | null;
  act: (key: string, action: string, extra?: Record<string, unknown>) => Promise<void>;
  retryRelease: (idx: number) => Promise<void>;
  viewer: string | null;
}) {
  const [proof, setProof] = useState(m.evidence || "");
  const [mode, setMode] = useState<"none" | "done" | "dispute">("none");
  const [reason, setReason] = useState("");
  const s = STATUS[m.status];
  const k = (a: string) => `${a}-${m.idx}`;
  const active = funded && (m.status === "DONE" && role === "client");
  const canDispute = funded && (role === "client" || role === "lead") && (m.status === "PENDING" || m.status === "DONE");

  return (
    <Card className={cx("p-4", active && "border-brand ring-1 ring-brand")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {m.description} · <span className="font-medium">{m.memberName}</span>
          </p>
          <p className="font-mono text-xs text-muted">
            {shortAddr(m.receiver)}
            {viewer === m.receiver && <span className="ml-1 font-sans font-semibold text-brand">(you)</span>}
          </p>
        </div>
        <p className="text-lg font-bold">{num(m.amount)}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {funded && <Badge tone={s.tone}>{s.label}</Badge>}
        {m.status === "RELEASED" && (
          <>
            <span className="text-xs text-muted">≈ {num(afterFees(m.amount, feePct - 0.3), 2)} USDC received</span>
            <TxLink hash={m.releaseTx} />
          </>
        )}
      </div>

      {m.evidence && m.status !== "PENDING" && (
        <p className="mt-2 truncate text-sm text-muted">
          Proof:{" "}
          <a href={m.evidence} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
            {m.evidence.replace(/^https?:\/\//, "")}
          </a>
        </p>
      )}

      {m.status === "DISPUTED" && (
        <div className="mt-3 rounded-xl bg-red-soft p-3 text-sm text-red-ink">
          <p className="text-xs font-semibold">Raised by {m.disputeBy === viewer ? "you" : "a party"}</p>
          <p className="mt-0.5">“{m.disputeReason}”</p>
          <p className="mt-1 text-xs">{num(m.amount)} USDC frozen until Circle resolves it.</p>
        </div>
      )}
      {m.status === "RESOLVED" && (
        <div className="mt-3 rounded-xl bg-canvas p-3 text-sm">
          <Row label={`To ${m.memberName}`}>{num(m.toReceiver ?? 0)} USDC</Row>
          <Row label="Refund to client">{num(m.toClient ?? 0)} USDC</Row>
          <TxLink hash={m.resolveTx} />
        </div>
      )}

      {/* Actions */}
      {funded && (
        <div className="mt-3 space-y-2">
          {m.status === "PENDING" && role === "lead" && mode !== "dispute" && (
            mode === "done" ? (
              <div className="space-y-2">
                <input className="input" placeholder="Link to the work: figma.com/…, github.com/…, drive…" value={proof} onChange={(e) => setProof(e.target.value)} />
                <div className="flex gap-2">
                  <Button busy={busy && pending === k("done")} disabled={busy || !proof.trim()} onClick={() => act(k("done"), "done", { idx: m.idx, evidence: proof })}>
                    Mark done · sign
                  </Button>
                  <Button variant="ghost" onClick={() => setMode("none")}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setMode("done")}>Mark done + proof</Button>
            )
          )}
          {m.status === "PENDING" && role !== "lead" && <p className="text-sm text-muted">The team lead marks this done with proof when it&apos;s delivered.</p>}

          {m.status === "DONE" && role === "client" && mode !== "dispute" && (
            <Button full busy={busy && pending === k("approve")} disabled={busy} onClick={() => act(k("approve"), "approve", { idx: m.idx })}>
              Approve and pay {m.memberName}
            </Button>
          )}
          {m.status === "DONE" && role !== "client" && <p className="text-sm text-muted">Waiting for the client to approve.</p>}

          {m.status === "APPROVED" && role !== "viewer" && (
            <Button variant="secondary" busy={busy && pending === k("release")} disabled={busy} onClick={() => retryRelease(m.idx)}>
              Retry release
            </Button>
          )}

          {canDispute &&
            (mode === "dispute" ? (
              <div className="space-y-2">
                <textarea className="input min-h-20" placeholder="What went wrong? e.g. Only 4 of the 6 illustrations were delivered." value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="danger" busy={busy && pending === k("dispute")} disabled={busy || reason.trim().length < 5} onClick={() => act(k("dispute"), "dispute", { idx: m.idx, reason })}>
                    Raise dispute · sign
                  </Button>
                  <Button variant="ghost" onClick={() => setMode("none")}>Cancel</Button>
                </div>
                <p className="text-xs text-muted">The money for this milestone freezes until Circle resolves it.</p>
              </div>
            ) : (
              <button onClick={() => setMode("dispute")} className="block pt-1 text-xs font-semibold text-red-ink hover:underline">
                Raise a dispute
              </button>
            ))}
        </div>
      )}
    </Card>
  );
}

function ShareCard({ project, viewer, onConnect }: { project: Project; viewer: string | null; onConnect: () => void }) {
  const url = `${useOrigin()}/p/${project.id}`;
  const [copied, setCopied] = useState(false);
  const text = `Please fund our project "${project.title}" on Circle. Your ${num(project.total)} USDC is locked in escrow and only released when you approve each milestone: ${url}`;
  return (
    <Card className="space-y-4 p-5">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-xl text-brand">✓</span>
        <p className="mt-2 text-lg font-bold">Escrow is live on Stellar</p>
        <p className="text-sm text-muted">Send this link to the client. Work starts once they lock the {num(project.total)} USDC.</p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-canvas p-2 pl-3.5">
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{url.replace(/^https?:\/\//, "")}</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark">
        Share on WhatsApp
      </a>
      {!viewer && (
        <p className="text-center text-sm text-muted">
          Are you the client?{" "}
          <button onClick={onConnect} className="font-semibold text-brand">Connect your wallet</button> to lock the funds.
        </p>
      )}
    </Card>
  );
}

function ConnectHint({ viewer, who, onConnect }: { viewer: string | null; who: string; onConnect: () => void }) {
  if (viewer) return <p className="text-sm text-muted">Only {who} can do this.</p>;
  return (
    <Button variant="secondary" full onClick={onConnect}>
      Connect wallet
    </Button>
  );
}

function EveryonePaid({ project: p, feePct }: { project: Project & { milestones: Milestone[] }; feePct: number }) {
  const fees = p.milestones.reduce((s, m) => s + (m.status === "RELEASED" ? m.amount : m.toReceiver ?? 0) * (feePct / 100), 0);
  const refunded = p.milestones.reduce((s, m) => s + (m.toClient ?? 0), 0);
  return (
    <div className="space-y-5">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-2xl text-brand">✓</span>
        <h2 className="mt-3 text-2xl font-bold">Everyone has been paid</h2>
        <p className="mt-1 text-sm text-muted">Each share went straight from the escrow to that person&apos;s wallet.</p>
      </div>
      <Card className="divide-y divide-line">
        {p.milestones.map((m) => {
          const gross = m.status === "RELEASED" ? m.amount : m.toReceiver ?? 0;
          return (
            <div key={m.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold">{m.memberName}</p>
                <p className="truncate text-xs text-muted">{m.description}{m.status === "RESOLVED" ? " · resolved dispute" : ""}</p>
                <TxLink hash={m.releaseTx || m.resolveTx}>Transaction</TxLink>
              </div>
              <p className="font-bold">≈ {num(afterFees(gross, feePct - 0.3), 2)} USDC</p>
            </div>
          );
        })}
      </Card>
      <Card className="p-4">
        <Row label="Client paid">{num(p.total)} USDC</Row>
        {refunded > 0 && <Row label="Refunded to client">{num(refunded)} USDC</Row>}
        <Row label={`Circle fee ${p.platformFeePct}% + protocol fee 0.3%`}>≈ {num(fees, 2)} USDC</Row>
        <p className="mt-1 text-xs text-muted">Exact amounts are on each transaction.</p>
      </Card>
    </div>
  );
}
