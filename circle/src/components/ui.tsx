import Link from "next/link";
import { explorer } from "@/lib/config";
import { shortAddr } from "@/lib/format";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "dark" | "danger" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-brand/50",
  secondary: "bg-white text-ink border border-line hover:border-brand/40 hover:bg-brand-soft/40 disabled:opacity-50",
  dark: "bg-ink text-white hover:bg-black disabled:opacity-50",
  danger: "bg-white text-red-ink border border-red-ink/25 hover:bg-red-soft disabled:opacity-50",
  ghost: "text-brand hover:bg-brand-soft disabled:opacity-50",
};

export function buttonClass(variant: Variant = "primary", size: "md" | "lg" | "sm" = "md", full = false) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed",
    size === "lg" && "px-5 py-3.5 text-[15px]",
    size === "md" && "px-4 py-2.5 text-sm",
    size === "sm" && "px-3 py-1.5 text-[13px]",
    full && "w-full",
    variants[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  busy,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "lg" | "sm"; full?: boolean; busy?: boolean }) {
  return (
    <button {...props} disabled={props.disabled || busy} className={cx(buttonClass(variant, size, full), className)}>
      {busy && <Spinner />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  full,
  children,
  className,
}: {
  href: string;
  variant?: Variant;
  size?: "md" | "lg" | "sm";
  full?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cx(buttonClass(variant, size, full), className)}>
      {children}
    </Link>
  );
}

export function Spinner() {
  return <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />;
}

export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  // Let callers override the default background/border without a class-merging library.
  const hasBg = /(^|\s)bg-/.test(className);
  const hasBorder = /(^|\s)border-(?!t\b|b\b|l\b|r\b|dashed)/.test(className);
  return (
    <div {...rest} className={cx("rounded-2xl border", !hasBorder && "border-line", !hasBg && "bg-white", className)}>
      {children}
    </div>
  );
}

type Tone = "green" | "amber" | "blue" | "red" | "gray" | "dark";
const tones: Record<Tone, string> = {
  green: "bg-brand-soft text-brand",
  amber: "bg-amber-soft text-amber-ink",
  blue: "bg-blue-soft text-blue-ink",
  red: "bg-red-soft text-red-ink",
  gray: "bg-canvas text-muted",
  dark: "bg-ink text-white",
};
export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Row({ label, children, mono }: { label: React.ReactNode; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className={cx("text-right font-medium", mono && "font-mono text-xs")}>{children}</span>
    </div>
  );
}

export function TxLink({ hash, children = "View transaction" }: { hash?: string | null; children?: React.ReactNode }) {
  if (!hash) return null;
  return (
    <a href={explorer.tx(hash)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand underline-offset-2 hover:underline">
      {children} ↗
    </a>
  );
}

export function AddressLink({ address, name }: { address: string; name?: string | null }) {
  return (
    <Link href={`/u/${address}`} className="font-medium hover:text-brand">
      {name || <span className="font-mono text-xs">{shortAddr(address)}</span>}
    </Link>
  );
}

export function Avatar({ name, address, size = 40 }: { name?: string | null; address: string; size?: number }) {
  const label = (name || address.slice(1, 3)).trim().slice(0, 2).toUpperCase();
  // A stable hue from the address so each person gets their own colour.
  const hue = [...address].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${hue} 45% 38%)` }}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function PageHeader({ back, title, subtitle, action }: { back?: string; title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
            ← Back
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-xl bg-red-soft px-3.5 py-2.5 text-sm text-red-ink">{children}</p>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-line/60", className)} />;
}

export function Container({ children, narrow, className }: { children: React.ReactNode; narrow?: boolean; className?: string }) {
  return <div className={cx("mx-auto w-full px-4 py-8 sm:px-6", narrow ? "max-w-xl" : "max-w-6xl", className)}>{children}</div>;
}
