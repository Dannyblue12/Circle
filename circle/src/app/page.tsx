import Link from "next/link";
import { Suspense } from "react";
import { GigCard } from "@/components/gig-card";
import { HowItWorks } from "@/components/how-it-works";
import { PitchDeck } from "@/components/pitch-deck";
import { SplitDemo } from "@/components/split-demo";
import { Empty, LinkButton, Skeleton, cx } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { categoryCounts, listGigs, stats } from "@/lib/data";
import { num } from "@/lib/format";
import { serverConfig } from "@/lib/server-config";

export default function Home() {
  return (
    <>
      <Hero />
      <BuiltOn />
      <Problem />

      <section id="how" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Heading eyebrow="How it works" title="From gig to payout in four steps" text="Money is locked before work starts and released share by share, so nobody has to trust a screenshot." />
        <div className="reveal mt-10">
          <HowItWorks />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 sm:px-6 sm:pb-24 lg:grid-cols-[1fr_440px] lg:gap-14">
        <div className="reveal">
          <Eyebrow>Try it</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Split a gig. Everyone gets paid directly.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Applying as a team? Set each person&apos;s share in your application. When the client hires you, those shares become escrow milestones, and each one is paid
            straight to that member&apos;s own wallet. The team lead never has to hold or forward anyone&apos;s money.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {["Drag the sliders to change the split", "Shares always add up to the full budget", "What you see is what lands in each wallet, after fees"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon name="check" className="size-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal">
          <SplitDemo platformFeePct={serverConfig.platformFeePercent} />
        </div>
      </section>

      <Features />
      <WhyStellar />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Heading eyebrow="Live marketplace" title="Gigs open right now" text="Every gig is paid in USDC through escrow. Pick a category or browse them all." />
          <LinkButton href="/gigs" variant="secondary">
            Browse all gigs →
          </LinkButton>
        </div>
        <div className="mt-8">
          <Suspense fallback={<CategoryChips />}>
            <CategoryChipsWithCounts />
          </Suspense>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div>}>
            <LatestGigs />
          </Suspense>
        </div>
      </section>

      <section id="pitch" className="scroll-mt-20 px-3 sm:px-4">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-night px-4 py-14 text-white sm:px-10 sm:py-20 lg:px-14">
          <Glow className="-right-40 -top-40" />
          <div className="relative mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <Eyebrow dark>Pitch deck</Eyebrow>
                <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-5xl">Our pitch, in seven slides</h2>
                <p className="mt-4 leading-relaxed text-white/70">
                  Why Circle should be Stellar&apos;s global talent hub. Swipe or use the arrow keys, press F to present, and download the deck to share it.
                </p>
              </div>
              <Link href="/pitch" className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10">
                Open the deck page →
              </Link>
            </div>
            <div className="mt-10">
              <PitchDeck />
            </div>
          </div>
        </div>
      </section>

      <Team />
      <FinalCta />
    </>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-night text-white">
        <Glow className="-left-40 top-1/3" />
        <Glow className="-right-24 -top-24" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          aria-hidden
        />
        <div className="relative grid items-center gap-12 px-6 py-14 sm:px-10 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:px-14 lg:py-24">
          <div className="fade-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest text-mint">
              <span className="relative flex size-2">
                <span className="pulse-ring absolute inset-0 rounded-full bg-mint" />
                <span className="relative size-2 rounded-full bg-mint" />
              </span>
              Stellar&apos;s global talent hub · live on testnet
            </p>
            <h1 className="mt-6 text-[44px] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Get paid safely,
              <br />
              <span className="bg-gradient-to-r from-mint to-[#9ff0c9] bg-clip-text text-transparent">even as a team.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Find gigs in any skill. Clients lock USDC in escrow on Stellar before work starts, and when they approve, every team member is paid straight to their own
              wallet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/gigs" className="inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-3.5 text-[15px] font-semibold text-night transition hover:brightness-110 active:scale-[.98]">
                Find gigs <span aria-hidden>→</span>
              </Link>
              <Link href="/gigs/new" className="inline-flex items-center rounded-xl border border-white/20 px-5 py-3.5 text-[15px] font-semibold transition hover:border-white/40 hover:bg-white/5">
                Post a gig
              </Link>
              <a href="#pitch" className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-semibold text-white/80 transition hover:text-white">
                <span className="grid size-7 place-items-center rounded-full bg-white/10">
                  <Icon name="play" className="size-3" />
                </span>
                See the pitch
              </a>
            </div>
            <Suspense fallback={<div className="mt-10 h-14" />}>
              <Stats />
            </Suspense>
          </div>
          <OrbitVisual />
        </div>
      </div>
    </section>
  );
}

function OrbitVisual() {
  const members = [
    { l: "Ada", c: "bg-mint text-night", pos: "left-1/2 top-0" },
    { l: "Tunde", c: "bg-sky text-night", pos: "left-full top-1/2" },
    { l: "Ifeoma", c: "bg-sun text-night", pos: "left-1/2 top-full" },
    { l: "You", c: "bg-[#e7f3ec] text-night", pos: "left-0 top-1/2" },
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]" aria-hidden>
      <div className="absolute inset-0 rounded-full border border-dashed border-white/15" />
      <div className="absolute inset-[13%] rounded-full border-[10px] border-brand" />
      <div className="orbit absolute inset-[13%]">
        {members.map((m) => (
          <div key={m.l} className={cx("absolute -translate-x-1/2 -translate-y-1/2", m.pos)}>
            <div className={cx("counter-orbit grid size-14 place-items-center rounded-full border-[5px] border-night text-xs font-bold sm:size-16", m.c)}>{m.l}</div>
          </div>
        ))}
      </div>
      <div className="absolute inset-[34%] grid place-items-center rounded-full bg-gradient-to-br from-mint to-brand text-center shadow-[0_0_80px_-10px_rgb(61_220_151/0.6)]">
        <div>
          <p className="text-2xl font-extrabold tracking-wide text-night sm:text-3xl">USDC</p>
          <p className="text-[11px] font-semibold text-night/70 sm:text-xs">locked in escrow</p>
        </div>
      </div>
      <div className="float absolute -left-2 top-[6%] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm shadow-xl backdrop-blur-md sm:-left-8">
        <p className="text-[11px] text-white/60">Escrow funded</p>
        <p className="font-semibold">30 USDC locked</p>
      </div>
      <div className="float-slow absolute -right-2 bottom-[8%] flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-ink shadow-2xl sm:-right-6">
        <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="check" className="size-4" />
        </span>
        <div>
          <p className="text-[11px] text-muted">Released to Ada</p>
          <p className="font-bold text-brand">+14.81 USDC</p>
        </div>
      </div>
    </div>
  );
}

async function Stats() {
  const s = await stats();
  const items = [
    { k: "Open gigs", v: num(s.openGigs) },
    { k: "Talent", v: num(s.talent) },
    // On a fresh testnet demo nothing has been paid out yet; show the breadth instead of a zero.
    s.paidOut > 0 ? { k: "Paid out", v: `${num(s.paidOut)} USDC` } : { k: "Categories", v: String(CATEGORIES.length) },
  ];
  return (
    <dl className="mt-10 grid max-w-md grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5">
      {items.map((i) => (
        <div key={i.k} className="px-4 py-3">
          <dt className="text-[11px] uppercase tracking-wider text-white/50">{i.k}</dt>
          <dd className="mt-0.5 text-xl font-bold tabular-nums">{i.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Built on ---------- */

function BuiltOn() {
  const items: [string, IconName][] = [
    ["Stellar", "star"],
    ["Soroban smart contracts", "code"],
    ["Trustless Work escrow", "lock"],
    ["USDC", "coin"],
    ["Stellar Wallets Kit", "key"],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Built on</p>
        <ul className="flex flex-wrap justify-center gap-x-7 gap-y-3">
          {items.map(([label, icon]) => (
            <li key={label} className="flex items-center gap-2 text-sm font-semibold text-ink/70">
              <Icon name={icon} className="size-4 text-brand" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Problem ---------- */

function Problem() {
  const items: { t: string; d: string; icon: IconName; tone: string }[] = [
    { t: "Ghosted after delivery", d: "The work is sent, the client goes quiet, and there is nothing to fall back on.", icon: "clock", tone: "bg-red-soft text-red-ink" },
    { t: "One wallet holds the team’s pay", d: "Teams get paid through one lead, who then has to forward everyone’s share by hand.", icon: "users", tone: "bg-amber-soft text-amber-ink" },
    { t: "Fake payment alerts", d: "Screenshots and forged alerts “prove” a payment that never arrived.", icon: "warning", tone: "bg-blue-soft text-blue-ink" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Heading eyebrow="The problem" title="Freelancers deliver the work. Then the risk starts." />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map((x) => (
          <div key={x.t} className="reveal rounded-3xl border border-line bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/5">
            <span className={cx("grid size-12 place-items-center rounded-2xl", x.tone)}>
              <Icon name={x.icon} className="size-6" />
            </span>
            <p className="mt-5 text-xl font-bold tracking-tight">{x.t}</p>
            <p className="mt-2 leading-relaxed text-muted">{x.d}</p>
          </div>
        ))}
      </div>
      <p className="reveal mt-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        Talent is everywhere. <span className="text-brand">Safe, fair payment is not.</span>
      </p>
    </section>
  );
}

/* ---------- Features ---------- */

function Features() {
  const items: { t: string; d: string; icon: IconName }[] = [
    { t: "Multi-release escrow", d: "One milestone per person, locked on Stellar before any work starts.", icon: "lock" },
    { t: "Team splits", d: "Up to 10 members per job, each paid straight to their own wallet.", icon: "users" },
    { t: "On-chain receipts", d: "Pay links only count after Stellar confirms asset, amount, wallet and memo.", icon: "verified" },
    { t: "Fair disputes", d: "A disputed share freezes and can be split, say 70/30, in one transaction.", icon: "scale" },
    { t: "Wallet sign-in", d: "A SEP-10-style signature that can never be submitted. Keys never leave your wallet.", icon: "key" },
    { t: "Any skill, anywhere", d: "Twelve categories, from code and design to translation and tutoring.", icon: "globe" },
  ];
  return (
    <section className="px-3 sm:px-4">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-night px-6 py-16 text-white sm:px-10 sm:py-24 lg:px-14">
        <Glow className="-bottom-40 left-1/3" />
        <div className="relative mx-auto max-w-6xl">
          <Heading dark eyebrow="The proof" title="Built and running on Stellar today" text="Not a mock-up. Every piece below works end to end on Stellar testnet." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((x) => (
              <div key={x.t} className="reveal group rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:border-mint/40 hover:bg-white/[0.07]">
                <span className="grid size-12 place-items-center rounded-2xl bg-mint/10 text-mint transition group-hover:bg-mint group-hover:text-night">
                  <Icon name={x.icon} className="size-6" />
                </span>
                <p className="mt-5 text-lg font-bold">{x.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Why Stellar ---------- */

function WhyStellar() {
  const rows = [
    ["Built for", "Payments and cross-border remittances, first", "Fast general-purpose apps, DeFi and trading"],
    ["Fees", "Fixed base fee of 0.00001 XLM: tiny and predictable", "Low base fee, plus priority fees that rise when the network is busy"],
    ["Cash out locally", "Anchors and MoneyGram Access turn USDC into local cash", "Mostly through exchanges and third-party ramps"],
    ["Escrow", "Trustless Work: ready-made multi-release escrow on Soroban", "Build or integrate your own"],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <Heading eyebrow="Why Stellar" title="Why we build on Stellar, not Solana" text="Both networks are fast and support USDC. For freelancers, what matters is a fee you can predict and a way to spend what you earn." />
      <div className="reveal mt-10 grid gap-4 lg:grid-cols-2">
        <div className="relative rounded-3xl border-2 border-brand bg-white p-7 shadow-xl shadow-brand/10">
          <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">Our pick</span>
          <p className="text-xl font-bold">Stellar + Circle</p>
          <ul className="mt-5 space-y-4">
            {rows.map(([k, v]) => (
              <li key={k} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon name="check" className="size-3.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</p>
                  <p className="mt-0.5 font-medium">{v}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-line bg-white/60 p-7">
          <p className="text-xl font-bold text-ink/70">Solana</p>
          <ul className="mt-5 space-y-4">
            {rows.map(([k, , v]) => (
              <li key={k} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-canvas text-muted">
                  <Icon name="minus" className="size-3.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</p>
                  <p className="mt-0.5 text-muted">{v}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="reveal mt-8 text-center text-xl font-bold tracking-tight sm:text-2xl">
        Predictable fees and a local cash-out: <span className="text-brand">that&apos;s Stellar&apos;s home turf.</span>
      </p>
    </section>
  );
}

/* ---------- Gigs ---------- */

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

async function LatestGigs() {
  const gigs = await listGigs({ limit: 6 });
  if (!gigs.length) return <Empty title="No gigs yet">Be the first to post one.</Empty>;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {gigs.map((g) => (
        <div key={g.id} className="reveal">
          <GigCard gig={g} />
        </div>
      ))}
    </div>
  );
}

/* ---------- Team ---------- */

const TEAM = [
  { name: "Daniel", role: "Front-end Developer", note: "GDGoC Campus Lead", color: "bg-mint text-night" },
  { name: "Ubongabasi", role: "Co-lead · Product Co-developer", note: "Co-builds the product end to end", color: "bg-sky text-night" },
  { name: "Bassey", role: "Product Manager", note: "Works with GDGoC on her campus", color: "bg-sun text-night" },
  { name: "Favour", role: "Product QA & Testing", note: "Notion Campus Community Manager, UniUyo, 2+ years", color: "bg-brand text-white" },
];

function Team() {
  const why: { t: string; d: string; icon: IconName }[] = [
    { t: "Built-in distribution", d: "We already lead GDGoC and Notion campus communities: our first users are in our rooms.", icon: "users" },
    { t: "We ship", d: "Marketplace, escrow, team splits, disputes and pay links are live on testnet.", icon: "code" },
    { t: "Built where the need is", d: "Uyo, Nigeria: the freelancers we design for are our peers.", icon: "globe" },
  ];
  return (
    <section id="team" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <Heading eyebrow="The team · why us" title="We are the community Circle is for" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((m) => (
          <div key={m.name} className="reveal group rounded-3xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/10">
            <span className={cx("grid size-16 place-items-center rounded-2xl text-2xl font-bold transition group-hover:rotate-[-4deg] group-hover:scale-105", m.color)}>{m.name[0]}</span>
            <p className="mt-5 text-xl font-bold tracking-tight">{m.name}</p>
            <p className="mt-1 text-sm font-semibold text-brand">{m.role}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{m.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {why.map((w) => (
          <div key={w.t} className="reveal flex gap-4 rounded-2xl bg-brand-soft/60 p-5">
            <Icon name={w.icon} className="mt-0.5 size-6 shrink-0 text-brand" />
            <p className="text-sm leading-relaxed text-ink/80">
              <b className="text-ink">{w.t}.</b> {w.d}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */

function FinalCta() {
  return (
    <section className="px-3 pb-16 sm:px-4 sm:pb-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-gradient-to-br from-[#13965f] via-brand to-brand-dark px-6 py-16 text-center text-white sm:px-10 sm:py-20">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full border-[14px] border-mint/30" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full border-[14px] border-white/10" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Talent is everywhere. Getting paid safely should be too.</h2>
          <p className="mt-4 text-lg text-white/80">Join the circle: find a gig, post one, or bring a client you already have.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/gigs" className="rounded-xl bg-white px-5 py-3.5 text-[15px] font-semibold text-brand transition hover:bg-brand-soft active:scale-[.98]">
              Find gigs
            </Link>
            <Link href="/gigs/new" className="rounded-xl bg-night px-5 py-3.5 text-[15px] font-semibold transition hover:bg-black active:scale-[.98]">
              Post a gig
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/75">
            Got a client on WhatsApp or X?{" "}
            <Link href="/projects/new" className="font-semibold text-white underline underline-offset-4">Create a project</Link> or send a{" "}
            <Link href="/links/new" className="font-semibold text-white underline underline-offset-4">quick pay link</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Shared bits ---------- */

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={cx("font-mono text-xs font-medium uppercase tracking-widest", dark ? "text-mint" : "text-brand")}>{children}</p>;
}

function Heading({ eyebrow, title, text, dark }: { eyebrow: string; title: string; text?: string; dark?: boolean }) {
  return (
    <div className="reveal max-w-2xl">
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-[44px] sm:leading-[1.1]">{title}</h2>
      {text && <p className={cx("mt-4 text-lg leading-relaxed", dark ? "text-white/70" : "text-muted")}>{text}</p>}
    </div>
  );
}

function Glow({ className }: { className?: string }) {
  return <div className={cx("pointer-events-none absolute size-[520px] rounded-full bg-brand/40 blur-[120px]", className)} aria-hidden />;
}

type IconName = "check" | "play" | "star" | "code" | "lock" | "coin" | "key" | "clock" | "users" | "warning" | "verified" | "scale" | "globe" | "minus";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    play: <path d="M7 5v14l11-7L7 5Z" fill="currentColor" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z" />,
    code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />,
    lock: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    coin: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M14.5 9.5c-.4-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6.5V8M12 16v1.5" />
      </>
    ),
    key: <path d="M15 7a4 4 0 1 1-3.9 4.9L4 19v-3h3v-3h3l1.1-1.1A4 4 0 0 1 15 7Zm1 1.5h.01" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14c3 0 5 1.6 5 4.5" />
      </>
    ),
    warning: <path d="M12 3 2 20h20L12 3ZM12 10v4M12 17h.01" />,
    verified: <path d="M12 3 4.5 6v5c0 4.5 3.2 8.4 7.5 10 4.3-1.6 7.5-5.5 7.5-10V6L12 3Zm-3.5 9 2.5 2.5 5-5" />,
    scale: <path d="M12 3v18M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7Zm14 0-3 7a3.5 3.5 0 0 0 6 0l-3-7ZM8 21h8" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
      </>
    ),
    minus: <path d="M6 12h12" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}
