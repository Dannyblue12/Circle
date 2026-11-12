import { Suspense } from "react";
import { GigBrowser } from "@/components/gig-browser";
import { Container, Empty, LinkButton, PageHeader, Skeleton } from "@/components/ui";
import { listGigs, requestId } from "@/lib/data";
import { parseFilters } from "@/lib/gig-filters";

export const metadata = { title: "Find gigs" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default function GigsPage({ searchParams }: { searchParams: SP }) {
  return (
    <Container>
      <PageHeader
        title="Find gigs"
        subtitle="Every gig is paid in USDC through escrow. Apply solo or as a team."
        action={<LinkButton href="/gigs/new">Post a gig</LinkButton>}
      />
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Results({ searchParams }: { searchParams: SP }) {
  const [sp, gigs, navId] = await Promise.all([searchParams, listGigs({ limit: 200 }), requestId()]);
  if (!gigs.length) {
    return (
      <Empty title="No open gigs yet">
        Be the first: post what you need and pay through escrow.
        <div className="mt-4">
          <LinkButton href="/gigs/new" size="sm">Post a gig</LinkButton>
        </div>
      </Empty>
    );
  }
  // Keyed per request: a real navigation (a link to /gigs?category=…) starts from the URL,
  // while back/forward keeps whatever you had filtered.
  // Cards only need the client's name; don't ship whole profiles to the browser.
  const slim = gigs.map((g) => ({ ...g, client: g.client ? { name: g.client.name } : null }));
  return <GigBrowser key={navId} gigs={slim} initial={parseFilters(sp)} />;
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-11" />
      <Skeleton className="h-9" />
      <div className="grid gap-4 pt-2 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}
