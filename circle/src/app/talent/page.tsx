import Link from "next/link";
import { Suspense } from "react";
import { Avatar, Card, Container, Empty, PageHeader, Skeleton, cx } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { listTalent } from "@/lib/data";
import { num, splitSkills } from "@/lib/format";

export const metadata = { title: "Talent" };
type SP = Promise<{ q?: string; category?: string }>;

export default function TalentPage({ searchParams }: { searchParams: SP }) {
  return (
    <Container>
      <PageHeader title="Talent" subtitle="People getting paid on Circle, ranked by what they've earned through escrow." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Results({ searchParams }: { searchParams: SP }) {
  const { q = "", category = "" } = await searchParams;
  const people = await listTalent({ q: q.trim() || undefined, category: category || undefined });
  const href = (c: string) => `/talent?${new URLSearchParams({ ...(q ? { q } : {}), ...(c ? { category: c } : {}) })}`;
  return (
    <>
      <form className="mb-4 flex gap-2" action="/talent">
        {category && <input type="hidden" name="category" value={category} />}
        <input name="q" defaultValue={q} className="input" placeholder="Search by name or skill" />
        <button className="rounded-xl bg-ink px-5 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {["", ...CATEGORIES].map((c) => (
          <Link
            key={c || "all"}
            href={href(c)}
            className={cx("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium", category === c ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/40")}
          >
            {c || "All"}
          </Link>
        ))}
      </div>
      {people.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((u) => (
            <Link key={u.address} href={`/u/${u.address}`}>
              <Card className="h-full p-5 hover:border-brand/40">
                <div className="flex items-center gap-3">
                  <Avatar address={u.address} name={u.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      <span className="truncate">{u.name}</span>
                      {u.demo && <span className="shrink-0 rounded-full border border-dashed border-line px-1.5 text-[10px] font-medium text-muted">Sample</span>}
                    </p>
                    <p className="truncate text-xs text-muted">{u.headline || u.category}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {splitSkills(u.skills).slice(0, 4).map((s) => (
                    <span key={s} className="rounded-md bg-canvas px-2 py-0.5 text-xs text-muted">{s}</span>
                  ))}
                </div>
                <p className="mt-3 text-sm">
                  <b>{num(u.earned)} USDC</b> <span className="text-muted">earned · {u.jobs} paid {u.jobs === 1 ? "milestone" : "milestones"}</span>
                </p>
                {u.location && <p className="text-xs text-muted">{u.location}</p>}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Empty title="Nobody here yet">Set up your profile to be the first in this category.</Empty>
      )}
    </>
  );
}
