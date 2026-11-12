import Link from "next/link";
import { Suspense } from "react";
import { GigCard } from "@/components/gig-card";
import { Container, Empty, LinkButton, PageHeader, Skeleton, cx } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { listGigs } from "@/lib/data";

export const metadata = { title: "Find gigs" };

type SP = Promise<{ q?: string; category?: string }>;

export default function GigsPage({ searchParams }: { searchParams: SP }) {
  return (
    <Container>
      <PageHeader
        title="Find gigs"
        subtitle="Every gig is paid in USDC through escrow. Apply solo or as a team."
        action={<LinkButton href="/gigs/new">Post a gig</LinkButton>}
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Results({ searchParams }: { searchParams: SP }) {
  const { q = "", category = "" } = await searchParams;
  const gigs = await listGigs({ q: q.trim() || undefined, category: category || undefined });
  const href = (c: string) => `/gigs?${new URLSearchParams({ ...(q ? { q } : {}), ...(c ? { category: c } : {}) })}`;
  return (
    <>
      <form className="mb-4 flex gap-2" action="/gigs">
        {category && <input type="hidden" name="category" value={category} />}
        <input name="q" defaultValue={q} className="input" placeholder="Search gigs, e.g. logo, React, voice-over, Yoruba translation" />
        <button className="rounded-xl bg-ink px-5 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {["", ...CATEGORIES].map((c) => (
          <Link
            key={c || "all"}
            href={href(c)}
            className={cx(
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium",
              category === c ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/40",
            )}
          >
            {c || "All"}
          </Link>
        ))}
      </div>
      {gigs.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gigs.map((g) => (
            <GigCard key={g.id} gig={g} />
          ))}
        </div>
      ) : (
        <Empty title="No open gigs match that">Try another category, or post the gig you need done.</Empty>
      )}
    </>
  );
}
