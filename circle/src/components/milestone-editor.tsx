"use client";

import { isStellarAddress, num } from "@/lib/format";
import { cx } from "./ui";

export type MilestoneRow = { description: string; memberName: string; receiver: string; amount: string };

export function emptyRow(name = "", receiver = ""): MilestoneRow {
  return { description: "", memberName: name, receiver, amount: "" };
}

export function rowsTotal(rows: MilestoneRow[]) {
  return rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

export function rowsToPayload(rows: MilestoneRow[]) {
  return rows.map((r) => ({ ...r, amount: Number(r.amount) }));
}

/** One milestone = one person's share. Each share is paid straight to that person's wallet. */
export function MilestoneEditor({
  rows,
  onChange,
  budget,
}: {
  rows: MilestoneRow[];
  onChange: (rows: MilestoneRow[]) => void;
  budget?: number;
}) {
  const update = (i: number, patch: Partial<MilestoneRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const total = rowsTotal(rows);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="label mb-0">Milestones and team split</span>
        <span className="text-xs text-muted">1 milestone = 1 person&apos;s share</span>
      </div>
      <div className="space-y-3">
        {rows.map((r, i) => {
          const badAddr = r.receiver.length > 0 && !isStellarAddress(r.receiver);
          return (
            <div key={i} className="rounded-xl border border-line bg-white p-3.5">
              <div className="grid gap-2.5 sm:grid-cols-[1fr_120px]">
                <input
                  className="input"
                  placeholder="What gets delivered, e.g. Logo and design lead"
                  value={r.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
                <div className="relative">
                  <input
                    className="input pr-14 text-right font-semibold"
                    inputMode="decimal"
                    placeholder="0"
                    value={r.amount}
                    onChange={(e) => update(i, { amount: e.target.value.replace(/[^0-9.]/g, "") })}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">USDC</span>
                </div>
                <input className="input" placeholder="Who does it (name)" value={r.memberName} onChange={(e) => update(i, { memberName: e.target.value })} />
                <div className="flex gap-2 sm:col-span-1">
                  {rows.length > 1 && (
                    <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="w-full rounded-xl border border-line py-2 text-xs font-semibold text-muted hover:border-red-ink/30 hover:text-red-ink">
                      Remove
                    </button>
                  )}
                </div>
                <input
                  className={cx("input font-mono text-xs sm:col-span-2", badAddr && "border-red-ink/50")}
                  placeholder="Their Stellar wallet  G…"
                  value={r.receiver}
                  onChange={(e) => update(i, { receiver: e.target.value.trim() })}
                />
                {badAddr && <p className="text-xs text-red-ink sm:col-span-2">That doesn&apos;t look like a Stellar address (56 characters, starts with G).</p>}
              </div>
            </div>
          );
        })}
      </div>
      {rows.length < 10 && (
        <button
          type="button"
          onClick={() => onChange([...rows, emptyRow()])}
          className="mt-3 w-full rounded-xl border border-dashed border-brand/40 bg-brand-soft/40 py-2.5 text-sm font-semibold text-brand hover:bg-brand-soft"
        >
          + Add milestone / team member
        </button>
      )}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm">
        <span className="text-muted">Total client pays</span>
        <span className="font-bold">
          {num(total)} USDC
          {budget ? (
            <span className={cx("ml-2 text-xs font-medium", total > budget ? "text-amber-ink" : "text-muted")}>
              {total > budget ? `${num(total - budget)} over budget` : `budget ${num(budget)}`}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
