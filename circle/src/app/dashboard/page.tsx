import Link from "next/link";
import { Suspense } from "react";
import { RequireWallet } from "@/components/require-wallet";
import { Badge, Card, Container, Empty, Skeleton } from "@/components/ui";
import { getDashboard, getUser } from "@/lib/data";
import type { Milestone, Project } from "@/lib/db/schema";
import { num, shortAddr, timeAgo } from "@/lib/format";
import { getSessionAddress } from "@/lib/session";
import { getBalances } from "@/lib/stellar-server";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Container>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Dashboard />
      </Suspense>
    </Container>
  );
}

async function Dashboard() {
  const address = await getSessionAddress();
  if (!address) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <RequireWallet title="Connect your wallet to see your dashboard">{null}</RequireWallet>
      </div>
    );
  }
  const [d, user, bal] = await Promise.all([getDashboard(address), getUser(address), getBalances(address)]);
  const name = user?.name || shortAddr(address);

  return (
    <div className="space-y-8">
      {!user?.name && (
        <Link href="/profile" className="block rounded-2xl bg-amber-soft px-4 py-3 text-sm text-amber-ink">
          <b>Finish your profile</b> so clients can see your skills and work. →
        </Link>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border-brand bg-brand p-6 text-white">
          <p className="text-sm text-white/80">Hi {name} · USDC balance</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">{bal ? `${num(bal.usdc)} USDC` : "—"}</p>
          <p className="mt-1 text-sm text-white/80">
            {num(d.locked)} USDC locked in your active escrows · {num(d.earnings.total)} USDC earned on Circle
          </p>
          {bal && !bal.usdcTrustline && (
            <p className="mt-3 rounded-lg bg-white/15 px-3 py-2 text-xs">
              {bal.exists ? "Add a USDC trustline in your wallet to receive payments." : "This wallet isn't on testnet yet. Fund it with Friendbot, then add a USDC trustline."}
            </p>
          )}
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Action href="/gigs" title="Find gigs" text="Apply solo or as a team" />
          <Action href="/gigs/new" title="Post a gig" text="Hire with escrow" />
          <Action href="/projects/new" title="New project" text="Escrow + team split" />
          <Action href="/links/new" title="Quick pay link" text="Instant, no escrow" />
        </div>
      </div>

      <Section title="Your projects">
        {d.projects.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {d.projects.map((p) => (
              <Link key={p.id} href={`/p/${p.id}`}>
                <Card className="flex items-center justify-between gap-3 p-4 hover:border-brand/40">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="text-xs text-muted">
                      {p.clientAddress === address ? "You're the client" : p.leadAddress === address ? "You lead" : "Team member"} · {p.milestones.length}{" "}
                      {p.milestones.length === 1 ? "member" : "members"} · {num(p.total)} USDC
                    </p>
                  </div>
                  <ProjectBadge p={p} />
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Empty title="No projects yet">Get hired on a gig, or create a project for a client you already have.</Empty>
        )}
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Gigs you posted">
          {d.gigs.length ? (
            <div className="space-y-2">
              {d.gigs.map((g) => (
                <Link key={g.id} href={`/gigs/${g.id}`}>
                  <Card className="flex items-center justify-between gap-3 p-4 hover:border-brand/40">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{g.title}</p>
                      <p className="text-xs text-muted">{g.applicants} applicants · {num(g.budget)} USDC · {timeAgo(g.createdAt)}</p>
                    </div>
                    {g.status === "OPEN" ? <Badge tone="green">Open</Badge> : g.status === "HIRED" ? <Badge tone="blue">Hired</Badge> : <Badge>Closed</Badge>}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Empty title="You haven't posted a gig">Need something done? Post it and pay through escrow.</Empty>
          )}
        </Section>
        <Section title="Your applications">
          {d.applications.length ? (
            <div className="space-y-2">
              {d.applications.map(({ app, gig }) => (
                <Link key={app.id} href={`/gigs/${gig.id}`}>
                  <Card className="flex items-center justify-between gap-3 p-4 hover:border-brand/40">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{gig.title}</p>
                      <p className="text-xs text-muted">Your quote {num(app.total)} USDC · {timeAgo(app.createdAt)}</p>
                    </div>
                    {app.status === "HIRED" ? <Badge tone="blue">Hired</Badge> : app.status === "REJECTED" ? <Badge>Not selected</Badge> : <Badge tone="amber">Pending</Badge>}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Empty title="No applications yet">Browse gigs that match your skills.</Empty>
          )}
        </Section>
      </div>

      <Section title="Quick pay links">
        {d.links.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {d.links.map((l) => (
              <Link key={l.id} href={`/pay/${l.id}`}>
                <Card className="flex items-center justify-between gap-3 p-4 hover:border-brand/40">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.description}</p>
                    <p className="text-xs text-muted">Quick pay link · {num(l.amount)} USDC</p>
                  </div>
                  {l.status === "PAID" ? <Badge tone="green">Paid</Badge> : <Badge tone="amber">Waiting</Badge>}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Empty title="No pay links yet">For small jobs: a link with the amount fixed, verified on Stellar.</Empty>
        )}
      </Section>
    </div>
  );
}

function ProjectBadge({ p }: { p: Project & { milestones: Milestone[] } }) {
  if (!p.contractId) return <Badge>Setting up</Badge>;
  if (!p.funded) return <Badge tone="amber">Awaiting funding</Badge>;
  if (p.milestones.some((m) => m.status === "DISPUTED")) return <Badge tone="red">Dispute</Badge>;
  if (p.milestones.every((m) => ["RELEASED", "RESOLVED"].includes(m.status))) return <Badge tone="green">Paid</Badge>;
  if (p.milestones.some((m) => m.status === "DONE")) return <Badge tone="amber">Needs approval</Badge>;
  return <Badge tone="blue">In progress</Badge>;
}

function Action({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href}>
      <Card className="h-full p-4 hover:border-brand/40">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </Card>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
