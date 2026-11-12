export function shortAddr(address?: string | null, size = 4): string {
  if (!address) return "";
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}

export function usdc(amount: number | string, decimals = 2): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} USDC`;
}

export function num(amount: number, decimals = 2) {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

/** What a receiver gets after the platform fee and the 0.3% protocol fee. */
export function afterFees(amount: number, platformFeePct: number, protocolFeePct = 0.3) {
  return amount * (1 - (platformFeePct + protocolFeePct) / 100);
}

export function timeAgo(date: Date | number | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "number" ? date : date.getTime();
  const s = Math.max(1, Math.round((Date.now() - d) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function splitSkills(skills: string): string[] {
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isStellarAddress(v: string) {
  return /^G[A-Z2-7]{55}$/.test(v.trim());
}

const HOUR_MS = 3600_000;
const DAY_MS = 24 * HOUR_MS;

/** Posted in the last two days. */
export function isNew(createdAt: Date | number | null | undefined) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 2 * DAY_MS;
}

/** How urgent a deadline is, for a small label on gig cards and pages. */
export function dueLabel(deadline: Date | number | null | undefined): { text: string; tone: "red" | "amber" | "gray" } | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return { text: "Deadline passed", tone: "gray" };
  if (ms < DAY_MS) return { text: `${Math.max(1, Math.round(ms / HOUR_MS))}h left`, tone: "red" };
  const days = Math.ceil(ms / DAY_MS);
  if (days <= 5) return { text: `${days} days left`, tone: "amber" };
  return { text: `Due ${shortDate(deadline)}`, tone: "gray" };
}

export function shortDate(d: Date | number, withYear = false) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });
}
