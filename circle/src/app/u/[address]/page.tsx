import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { and, desc, eq, inArray } from "drizzle-orm";
import { GigCard } from "@/components/gig-card";
import { Avatar, Badge, Card, Container, Empty, LinkButton, Skeleton, TxLink } from "@/components/ui";
import { earningsFor, getUser, listGigs } from "@/lib/data";
import { db, milestones, projects } from "@/lib/db";
import { explorer } from "@/lib/config";
import { isStellarAddress, num, shortAddr, splitSkills } from "@/lib/format";
import { getSessionAddress } from "@/lib/session";

type Params = Promise<{ address: string }>;

export default function ProfilePage({ params }: { params: Params }) {
  return (
    <Container>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Profile params={params} />
      </Suspense>
    </Container>
  );
}

async function Profile({ params }: { params: Params }) {
  const { address } = await params;
  if (!isStellarAddress(address)) notFound();
  const [user, viewer, earnings, paid, gigs] = await Promise.all([
    getUser(address),
    getSessionAddress(),
    earningsFor(address),
    db
      .select({ m: milestones, title: projects.title })
      .from(milestones)
      .innerJoin(projects, eq(projects.id, milestones.projectId))
      .where(and(eq(milestones.receiver, address), inArray(milestones.status, ["RELEASED", "RESOLVED"])))
      .orderBy(desc(milestones.updatedAt))
      .limit(10),
    listGigs({ status: "ALL", limit: 60 }).then((g) => g.filter((x) => x.clientAddress === address).slice(0, 6)),
  ]);
  const isMe = viewer === address;

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <Card className="p-6">
          <Avatar address={address} name={user?.name} size={72} />
          <h1 className="mt-4 text-2xl font-bold">{user?.name || shortAddr(address)}</h1>
          {user?.headline && <p className="mt-1 text-muted">{user.headline}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {user?.category && <Badge>{user.category}</Badge>}
            {user?.location && <Badge tone="gray">{user.location}</Badge>}
            {user?.demo && (
              <span title="Sample account added to show how Circle works" className="rounded-full border border-dashed border-line px-2.5 py-0.5 text-xs font-medium text-muted">
                Sample profile
              </span>
            )}
          </div>
          <a href={explorer.account(address)} target="_blank" rel="noreferrer" className="mt-4 block break-all font-mono text-xs text-muted hover:text-brand">
            {address}
          </a>
          {user?.link && (
            <a href={user.link} target="_blank" rel="noreferrer" className="mt-3 block text-sm font-semibold text-brand">Portfolio ↗</a>
          )}
          {isMe && <LinkButton href="/profile" variant="secondary" full className="mt-4">Edit profile</LinkButton>}
        </Card>
        <Card className="grid grid-cols-2 p-5 text-center">
          <div>
            <p className="text-2xl font-bold">{num(earnings.total)}</p>
            <p className="text-xs text-muted">USDC earned</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{earnings.jobs}</p>
            <p className="text-xs text-muted">paid milestones</p>
          </div>
        </Card>
      </aside>
      <div className="min-w-0 space-y-8">
        {(user?.bio || user?.skills) && (
          <section>
            <h2 className="mb-3 text-lg font-bold">About</h2>
            <Card className="p-5">
              {user?.bio && <p className="whitespace-pre-line leading-relaxed">{user.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {splitSkills(user?.skills || "").map((s) => (
                  <span key={s} className="rounded-md bg-canvas px-2 py-0.5 text-xs text-muted">{s}</span>
                ))}
              </div>
            </Card>
          </section>
        )}
        <section>
          <h2 className="mb-3 text-lg font-bold">Paid work, verified on Stellar</h2>
          {paid.length ? (
            <Card className="divide-y divide-line">
              {paid.map(({ m, title }) => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link href={`/p/${m.projectId}`} className="font-semibold hover:text-brand">{title}</Link>
                    <p className="truncate text-xs text-muted">{m.description}</p>
                    <TxLink hash={m.releaseTx || m.resolveTx} />
                  </div>
                  <p className="font-bold">{num(m.status === "RELEASED" ? m.amount : m.toReceiver ?? 0)} USDC</p>
                </div>
              ))}
            </Card>
          ) : (
            <Empty title="No paid work yet" />
          )}
        </section>
        {gigs.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">Gigs posted</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {gigs.map((g) => (
                <GigCard key={g.id} gig={g} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
