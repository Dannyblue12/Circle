import Link from "next/link";
import { Suspense } from "react";
import { GigCard } from "@/components/gig-card";
import { SplitDemo } from "@/components/split-demo";
import { Card, Empty, LinkButton, Skeleton } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { categoryCounts, listGigs, stats } from "@/lib/data";
import { num } from "@/lib/format";
import { serverConfig } from "@/lib/server-config";

const VALUES = [
  { title: "Money locked before work starts", text: "The client's USDC sits in an escrow contract on Stellar that anyone can check. No more ghosting after delivery." },
  { title: "Every member paid directly", text: "Each person's share goes straight to their own wallet. The team lead never holds everyone's money." },
  { title: "Receipts checked on-chain", text: "Fixed network, asset and amount. A payment only counts once Stellar confirms it. No fake alerts, no screenshots." },
];

const STEPS = [
  { n: "1", title: "Post or find a gig", text: "Clients post a job with a budget. Freelancers and teams apply with a pitch and a split." },
  { n: "2", title: "Hire and lock the money", text: "The client hires and locks USDC in escrow. Work starts once the money is visible on Stellar." },
  { n: "3", title: "Deliver with proof", text: "The lead marks each milestone done with a Figma, GitHub or Drive link." },
  { n: "4", title: "Approve, everyone's paid", text: "The client approves and that person's share is released to their wallet automatically." },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">Gigs + escrow + team payouts in USDC</p>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Get paid safely,
            <br />
            even as a team.
          </h1>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted">
            Find gigs in any skill, from design and code to writing, video and tutoring. Clients lock USDC in escrow before work starts. When they approve, every team member is paid straight to their own wallet.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton href="/gigs" size="lg">Find gigs</LinkButton>
            <LinkButton href="/gigs/new" size="lg" variant="secondary">Post a gig</LinkButton>
          </div>
          <Suspense fallback={<div className="mt-8 h-12" />}>
            <Stats />
          </Suspense>
        </div>
        <div className="space-y-3">
          {VALUES.map((v, i) => (
            <Card key={v.title} className="flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                {i === 0 ? <LockIcon /> : i === 1 ? <PeopleIcon /> : <CheckIcon />}
              </span>
              <div>
                <p className="font-semibold">{v.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{v.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Suspense fallback={<CategoryChips />}>
          <CategoryChipsWithCounts />
        </Suspense>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight">Latest gigs</h2>
          <Link href="/gigs" className="text-sm font-semibold text-brand">See all →</Link>
        </div>
        <Suspense fallback={<div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-52" />)}</div>}>
          <LatestGigs />
        </Suspense>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="mb-5 text-xl font-bold tracking-tight">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <Card key={s.n} className="p-5">
              <span className="grid size-8 place-items-center rounded-full bg-brand text-sm font-bold text-white">{s.n}</span>
              <p className="mt-3 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:gap-14">
        <div>
          <p className="mb-3 inline-flex rounded-full bg-blue-soft px-3 py-1 text-xs font-semibold text-blue-ink">Try it</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Split a gig. Everyone gets paid directly.</h2>
          <p className="mt-3 max-w-md leading-relaxed text-muted">
            Applying as a team? Set each person&apos;s share in your application. When the client hires you, those shares become escrow milestones, and each one is paid
            straight to that member&apos;s own wallet. The team lead never has to hold or forward anyone&apos;s money.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {["Drag the sliders to change the split", "Shares always add up to the full budget", "What you see is what lands in each wallet, after fees"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-brand-soft text-brand"><CheckIcon /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <SplitDemo platformFeePct={serverConfig.platformFeePercent} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Card className="grid gap-6 bg-brand p-7 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
          <div>
            <p className="text-xl font-bold">Got a client on WhatsApp or X?</p>
            <p className="mt-1 max-w-xl text-white/80">
              You don&apos;t need to find them here. Create a project with your team split and send the client a link, or send a quick pay link for small jobs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects/new" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-soft">New project</Link>
            <Link href="/links/new" className="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">Quick pay link</Link>
          </div>
        </Card>
      </section>
    </>
  );
}

function CategoryChips({ counts }: { counts?: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => (
        <Link
          key={c}
          href={`/gigs?category=${encodeURIComponent(c)}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium transition hover:-translate-y-px hover:border-brand/40 hover:text-brand"
        >
          {c}
          {counts && counts[c] ? <span className="rounded-full bg-brand-soft px-1.5 text-[11px] font-semibold text-brand">{counts[c]}</span> : null}
        </Link>
      ))}
    </div>
  );
}

async function CategoryChipsWithCounts() {
  return <CategoryChips counts={await categoryCounts()} />;
}

async function Stats() {
  const s = await stats();
  return (
    <dl className="mt-8 flex gap-8">
      <div>
        <dt className="text-xs text-muted">Open gigs</dt>
        <dd className="text-xl font-bold">{s.openGigs}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Talent</dt>
        <dd className="text-xl font-bold">{s.talent}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Paid out</dt>
        <dd className="text-xl font-bold">{num(s.paidOut)} USDC</dd>
      </div>
    </dl>
  );
}

async function LatestGigs() {
  const gigs = await listGigs({ limit: 6 });
  if (!gigs.length) return <Empty title="No gigs yet">Be the first to post one.</Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {gigs.map((g) => (
        <GigCard key={g.id} gig={g} />
      ))}
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 14c3 0 5 1.6 5 4.5" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
