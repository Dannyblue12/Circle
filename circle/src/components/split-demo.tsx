"use client";

import { useState } from "react";
import { PROTOCOL_FEE_PERCENT } from "@/lib/config";
import { afterFees, num } from "@/lib/format";
import { SplitBar } from "./split-bar";
import { Avatar, LinkButton } from "./ui";

// Made-up example addresses, only used to colour the avatars.
const TEAM = [
  { name: "Ada", role: "Logo and design lead", seed: "GADAEXAMPLE" },
  { name: "Tunde", role: "Illustrations", seed: "GTUNDEEXAMPLE" },
  { name: "Ifeoma", role: "Packaging mockups", seed: "GIFEOMAEXAMPLE" },
];

/** Moves one share and rebalances the others proportionally, so shares always add up to 100%. */
function rebalance(shares: number[], i: number, value: number): number[] {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  const others = shares.reduce((s, x, j) => (j === i ? s : s + x), 0);
  const rest = 100 - v;
  const next = shares.map((x, j) => (j === i ? v : others > 0 ? (x / others) * rest : rest / (shares.length - 1)));
  const rounded = next.map((x, j) => (j === i ? x : Math.floor(x)));
  // Give rounding leftovers to the largest other share.
  const diff = 100 - rounded.reduce((s, x) => s + x, 0);
  if (diff) {
    const k = rounded.reduce((best, x, j) => (j !== i && (best < 0 || x > rounded[best]) ? j : best), -1);
    if (k >= 0) rounded[k] += diff;
  }
  return rounded;
}

/** Landing page: drag the sliders to see what each person receives, straight to their own wallet. */
export function SplitDemo({ platformFeePct }: { platformFeePct: number }) {
  const [budget, setBudget] = useState(30);
  const [shares, setShares] = useState([50, 33, 17]);
  const amounts = shares.map((s) => (budget * s) / 100);

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_40px_-24px_rgb(12_121_79/0.45)] sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Client locks in escrow</p>
          <p className="text-3xl font-bold tabular-nums">
            {num(budget)} <span className="text-base font-semibold text-muted">USDC</span>
          </p>
        </div>
        <div className="flex gap-1.5">
          {[30, 120, 500].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBudget(b)}
              className={
                budget === b
                  ? "rounded-lg border border-brand bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"
                  : "rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink"
              }
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <input
        type="range"
        min={10}
        max={1000}
        step={5}
        value={budget}
        onChange={(e) => setBudget(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--color-brand)]"
        aria-label="Gig budget in USDC"
      />

      <SplitBar className="mt-4" parts={TEAM.map((m, i) => ({ key: m.name, label: m.name, amount: amounts[i] }))} />

      <ul className="mt-4 space-y-3">
        {TEAM.map((m, i) => (
          <li key={m.name} className="rounded-xl bg-canvas p-3">
            <div className="flex items-center gap-3">
              <Avatar address={m.seed} name={m.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {m.name} <span className="font-normal text-muted">· {m.role}</span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={shares[i]}
                  onChange={(e) => setShares(rebalance(shares, i, Number(e.target.value)))}
                  className="mt-1 w-full accent-[var(--color-brand)]"
                  aria-label={`${m.name}'s share in percent`}
                />
              </div>
              <div className="w-20 shrink-0 text-right sm:w-24">
                <p className="text-sm font-bold tabular-nums">{num(afterFees(amounts[i], platformFeePct, PROTOCOL_FEE_PERCENT))}</p>
                <p className="text-[11px] text-muted">USDC to wallet</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Each share is released to that person&apos;s own wallet when the client approves their milestone. Fees taken on-chain at release: Circle {num(platformFeePct)}% +
        Trustless Work {PROTOCOL_FEE_PERCENT}%.
      </p>
      <LinkButton href="/gigs?sort=budget-high" variant="secondary" full className="mt-4">
        Find a gig for your team
      </LinkButton>
    </div>
  );
}
