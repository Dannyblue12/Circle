import Link from "next/link";

const COLUMNS = [
  { title: "Marketplace", links: [["Find gigs", "/gigs"], ["Post a gig", "/gigs/new"], ["Talent", "/talent"], ["Dashboard", "/dashboard"]] },
  { title: "Get paid", links: [["New project", "/projects/new"], ["Quick pay link", "/links/new"], ["Edit profile", "/profile"]] },
  { title: "About", links: [["How it works", "/#how"], ["Pitch deck", "/pitch"], ["Team", "/#team"], ["Download deck (PDF)", "/pitch/circle-pitch-deck.pdf"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-night text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-brand">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
                <circle cx="12" cy="12" r="7" />
              </svg>
            </span>
            <span className="text-[17px]">Circle</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Get paid safely, even as a team. Gigs, escrow and team payouts in USDC on Stellar.
          </p>
          <p className="mt-4 inline-flex rounded-full border border-mint/25 bg-mint/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-mint">
            Stellar testnet demo
          </p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">{c.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  {href.endsWith(".pdf") ? (
                    <a href={href} download className="text-white/75 transition hover:text-mint">{label}</a>
                  ) : (
                    <Link href={href} className="text-white/75 transition hover:text-mint">{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/45 sm:px-6">
          Escrow by Trustless Work on Soroban · Your keys never leave your wallet · Built in Uyo, Nigeria, for the world
        </p>
      </div>
    </footer>
  );
}
