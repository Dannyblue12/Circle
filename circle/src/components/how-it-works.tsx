"use client";

import { useEffect, useState } from "react";
import { cx } from "./ui";

const STEP_MS = 5000;

const STEPS = [
  { title: "Post or find a gig", text: "Clients post a job with a budget. Freelancers apply solo, or as a team with a split." },
  { title: "Hire and lock the money", text: "The client hires and locks USDC in escrow on Stellar. Work starts once the money is visible." },
  { title: "Deliver with proof", text: "The lead marks each milestone done with a Figma, GitHub or Drive link." },
  { title: "Approve, everyone’s paid", text: "The client approves and that person’s share is released straight to their own wallet." },
];

/** Four steps that advance on their own (paused on hover or focus) with a small product mock for each. */
export function HowItWorks() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [step, paused]);

  return (
    <div
      className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ol className="space-y-2.5" role="tablist" aria-label="How Circle works">
        {STEPS.map((s, i) => {
          const on = i === step;
          return (
            <li key={s.title}>
              <button
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="how-panel"
                onClick={() => setStep(i)}
                className={cx(
                  "relative w-full overflow-hidden rounded-2xl border p-5 text-left transition",
                  on ? "border-brand/30 bg-white shadow-[0_12px_32px_-18px_rgb(12_121_79/0.5)]" : "border-transparent hover:bg-white/60",
                )}
              >
                <div className="flex items-start gap-4">
                  <span className={cx("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold transition", on ? "bg-brand text-white" : "bg-line/70 text-muted")}>{i + 1}</span>
                  <div>
                    <p className={cx("font-semibold", on ? "text-ink" : "text-ink/70")}>{s.title}</p>
                    <p className={cx("grid text-sm leading-relaxed text-muted transition-all duration-300", on ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                      <span className="overflow-hidden">{s.text}</span>
                    </p>
                  </div>
                </div>
                {on && !paused && (
                  <span key={step} className="progress absolute inset-x-0 bottom-0 h-0.5 bg-brand" style={{ animationDuration: `${STEP_MS}ms` }} aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div id="how-panel" role="tabpanel" aria-live="polite" className="relative">
        <div className="absolute -inset-4 -z-10 rounded-[36px] bg-gradient-to-br from-brand-soft via-white to-blue-soft/60" aria-hidden />
        <div key={step} className="fade-in rounded-3xl border border-line bg-white p-6 shadow-xl shadow-brand/5 sm:p-8">
          {step === 0 && <PostMock />}
          {step === 1 && <EscrowMock />}
          {step === 2 && <DeliverMock />}
          {step === 3 && <PayoutMock />}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted">{children}</p>;
}

function PostMock() {
  return (
    <div className="space-y-4">
      <Label>New application</Label>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Brand kit for a bakery in Uyo</p>
        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">30 USDC</span>
      </div>
      <div className="rounded-2xl bg-canvas p-4">
        <p className="text-sm text-muted">Team of 3 · led by Ada</p>
        <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full">
          <span className="w-1/2 bg-brand" />
          <span className="w-1/3 bg-blue-ink" />
          <span className="w-1/6 bg-sun" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          {[["Ada", "Logo", "15"], ["Tunde", "Illustrations", "10"], ["Ifeoma", "Mockups", "5"]].map(([n, r, a]) => (
            <div key={n} className="rounded-xl bg-white p-2.5">
              <p className="font-semibold">{n}</p>
              <p className="text-muted">{r}</p>
              <p className="mt-1 font-bold">{a} USDC</p>
            </div>
          ))}
        </div>
      </div>
      <button type="button" tabIndex={-1} className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white">Hire · 30 USDC</button>
    </div>
  );
}

function EscrowMock() {
  return (
    <div className="space-y-5 text-center">
      <Label>Escrow on Stellar</Label>
      <div className="relative mx-auto grid size-28 place-items-center">
        <span className="pulse-ring absolute inset-0 rounded-full bg-brand/25" aria-hidden />
        <span className="relative grid size-24 place-items-center rounded-full bg-brand text-white shadow-lg">
          <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
      </div>
      <div>
        <p className="text-4xl font-bold tracking-tight">30 USDC</p>
        <p className="text-sm text-muted">locked before work starts</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-left text-xs">
        {[["Client", "Signed"], ["Contract", "Deployed"], ["Funds", "Locked"]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-canvas p-3">
            <p className="text-muted">{k}</p>
            <p className="mt-0.5 flex items-center gap-1 font-semibold text-brand">✓ {v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeliverMock() {
  const rows = [
    { name: "Ada", task: "Logo and design lead", state: "Done", proof: "figma.com/file/…" },
    { name: "Tunde", task: "Illustrations", state: "Done", proof: "drive.google.com/…" },
    { name: "Ifeoma", task: "Packaging mockups", state: "In progress", proof: "" },
  ];
  return (
    <div className="space-y-4">
      <Label>Milestones</Label>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center justify-between gap-3 rounded-2xl border border-line p-4">
          <div className="min-w-0">
            <p className="font-semibold">{r.task}</p>
            <p className="truncate text-xs text-muted">
              {r.name}
              {r.proof && <span className="text-brand"> · {r.proof}</span>}
            </p>
          </div>
          <span className={cx("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", r.state === "Done" ? "bg-brand-soft text-brand" : "bg-amber-soft text-amber-ink")}>{r.state}</span>
        </div>
      ))}
    </div>
  );
}

function PayoutMock() {
  const rows = [
    { name: "Ada", amount: "14.81", color: "bg-brand" },
    { name: "Tunde", amount: "9.87", color: "bg-blue-ink" },
    { name: "Ifeoma", amount: "4.94", color: "bg-sun" },
  ];
  return (
    <div className="space-y-4">
      <Label>Released to each wallet</Label>
      {rows.map((r, i) => (
        <div key={r.name} className="fade-in flex items-center justify-between rounded-2xl bg-canvas p-4" style={{ animationDelay: `${i * 150}ms` }}>
          <div className="flex items-center gap-3">
            <span className={cx("grid size-10 place-items-center rounded-full text-sm font-bold text-white", r.color)}>{r.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-muted">Own wallet · confirmed on Stellar</p>
            </div>
          </div>
          <p className="font-bold text-brand">+{r.amount} USDC</p>
        </div>
      ))}
      <p className="text-center text-xs text-muted">Example amounts after the Circle and Trustless Work fees, taken on-chain at release.</p>
    </div>
  );
}
