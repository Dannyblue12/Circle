"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { num } from "@/lib/format";
import { api } from "./api-client";
import { Button, ErrorNote, Row } from "./ui";
import { useAction } from "./wallet";

export function ResolveForm({ projectId, idx, amount, memberName }: { projectId: string; idx: number; amount: number; memberName: string }) {
  const router = useRouter();
  const { busy, error, run } = useAction();
  const [pct, setPct] = useState(70);
  const toMember = (amount * pct) / 100;
  return (
    <div className="space-y-3">
      <div className="h-2 overflow-hidden rounded-full bg-amber-ink/70">
        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-[#0c794f]" />
      <Row label={`To ${memberName} (${pct}%)`}>{num(toMember)} USDC</Row>
      <Row label={`Refund to client (${100 - pct}%)`}>{num(amount - toMember)} USDC</Row>
      <ErrorNote>{error}</ErrorNote>
      <Button
        variant="dark"
        full
        busy={busy}
        onClick={() =>
          run(async () => {
            await api("/api/admin/resolve", { projectId, idx, toReceiverPct: pct });
            router.refresh();
          })
        }
      >
        Resolve and pay out
      </Button>
      <p className="text-center text-xs text-muted">Signed by the Platform account. The contract pays both addresses in one transaction.</p>
    </div>
  );
}
