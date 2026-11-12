import { num } from "@/lib/format";
import { cx } from "./ui";

// Distinct, readable on white, and none of them reads as an error state.
const COLORS = ["#0c794f", "#2f49a8", "#c27c0e", "#8a3fa0", "#0f7d8c", "#b0503f", "#5c6b20", "#3d5a80", "#a33f6b", "#6b4f2a"];

export type SplitPart = { key: string; label: string; amount: number };

/** Groups parts that go to the same person (same key), keeping first-seen order. */
export function groupParts(parts: SplitPart[]): SplitPart[] {
  const byKey = new Map<string, SplitPart>();
  for (const p of parts) {
    const prev = byKey.get(p.key);
    if (prev) prev.amount += p.amount;
    else byKey.set(p.key, { ...p });
  }
  return [...byKey.values()];
}

/** A stacked bar showing who gets what share of a payment. Works in server and client components. */
export function SplitBar({ parts, className, showAmounts }: { parts: SplitPart[]; className?: string; showAmounts?: boolean }) {
  const grouped = groupParts(parts.map((p) => ({ ...p, amount: Math.max(0, p.amount || 0) })));
  const total = grouped.reduce((s, p) => s + p.amount, 0);
  const pct = (a: number) => (total > 0 ? Math.round((a / total) * 100) : 0);
  return (
    <div className={className}>
      <div
        className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={grouped.map((p) => `${p.label || "Unnamed"} ${pct(p.amount)}%`).join(", ")}
      >
        {total > 0 &&
          grouped.map((p, i) =>
            p.amount > 0 ? (
              <span
                key={p.key}
                className="h-full transition-[width] duration-300 ease-out first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(p.amount / total) * 100}%`, background: COLORS[i % COLORS.length] }}
              />
            ) : null,
          )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {grouped.map((p, i) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden />
            <span className={cx("font-medium", !p.label && "text-muted")}>{p.label || `Member ${i + 1}`}</span>
            <span className="tabular-nums text-muted">
              {showAmounts && `${num(p.amount)} USDC · `}
              {pct(p.amount)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
