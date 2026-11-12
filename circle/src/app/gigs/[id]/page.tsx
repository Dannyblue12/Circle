import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApplyForm } from "@/components/forms/apply-form";
import { CloseGigButton, HireButton } from "@/components/gig-owner-actions";
import { RequireWallet } from "@/components/require-wallet";
import { AddressLink, Avatar, Badge, Card, Container, Empty, LinkButton, Row, Skeleton } from "@/components/ui";
import { getGig } from "@/lib/data";
import { num, shortAddr, splitSkills, timeAgo } from "@/lib/format";
import { getSessionAddress } from "@/lib/session";

type Params = Promise<{ id: string }>;

export default function GigPage({ params }: { params: Params }) {
  return (
    <Container>
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <GigView params={params} />
      </Suspense>
    </Container>
  );
}

async function GigView({ params }: { params: Params }) {
  const { id } = await params;
  const [gig, viewer] = await Promise.all([getGig(id), getSessionAddress()]);
  if (!gig) notFound();
  const isOwner = viewer === gig.clientAddress;
  const mine = gig.applications.find((a) => a.leadAddress === viewer);
  const hired = gig.applications.find((a) => a.status === "HIRED");
  const canSeeProject = gig.projectId && (isOwner || mine?.status === "HIRED");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <Link href="/gigs" className="mb-3 inline-flex text-sm font-medium text-muted hover:text-ink">← All gigs</Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{gig.category}</Badge>
          {gig.status === "OPEN" ? <Badge tone="green">Open</Badge> : gig.status === "HIRED" ? <Badge tone="blue">Hired</Badge> : <Badge>Closed</Badge>}
          <span className="text-xs text-muted">Posted {timeAgo(gig.createdAt)}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{gig.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {splitSkills(gig.skills).map((s) => (
            <span key={s} className="rounded-md bg-white px-2 py-0.5 text-xs text-muted ring-1 ring-line">{s}</span>
          ))}
        </div>
        <Card className="mt-5 whitespace-pre-line p-5 text-[15px] leading-relaxed">{gig.description}</Card>

        {isOwner ? (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Applications ({gig.applications.length})</h2>
              {gig.status === "OPEN" && <CloseGigButton gigId={gig.id} />}
            </div>
            {gig.applications.length === 0 ? (
              <Empty title="No applications yet">Share this page with people you&apos;d like to hire.</Empty>
            ) : (
              <div className="space-y-4">
                {gig.applications.map((a) => (
                  <Card key={a.id} id={`app-${a.id}`} className="scroll-mt-24 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar address={a.leadAddress} name={a.lead?.name} />
                        <div>
                          <AddressLink address={a.leadAddress} name={a.lead?.name} />
                          <p className="text-xs text-muted">
                            {a.lead?.headline || shortAddr(a.leadAddress)} · {a.milestones.length > 1 ? `team of ${new Set(a.milestones.map((m) => m.receiver)).size}` : "solo"}
                          </p>
                        </div>
                      </div>
                      {a.status === "HIRED" ? <Badge tone="blue">Hired</Badge> : a.status === "REJECTED" ? <Badge>Not selected</Badge> : null}
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{a.pitch}</p>
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand">Portfolio ↗</a>
                    )}
                    <div className="mt-4 rounded-xl bg-canvas p-3">
                      {a.milestones.map((m, i) => (
                        <Row key={i} label={<>{m.description} · <span className="text-ink">{m.memberName}</span></>}>{num(m.amount)} USDC</Row>
                      ))}
                      <div className="mt-1 border-t border-line pt-1">
                        <Row label="Total">{num(a.total)} USDC</Row>
                      </div>
                    </div>
                    {gig.status === "OPEN" && a.status === "PENDING" && (
                      <div className="mt-4">
                        <HireButton gigId={gig.id} applicationId={a.id} total={a.total} />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        ) : gig.status === "OPEN" ? (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">{mine ? "Your application" : "Apply"}</h2>
            <RequireWallet title="Connect your wallet to apply" text="Your wallet is your account and where you get paid.">
              <ApplyForm gigId={gig.id} budget={gig.budget} existing={mine ?? null} />
            </RequireWallet>
          </section>
        ) : mine ? (
          <Card className="mt-8 p-5 text-sm">
            {mine.status === "HIRED" ? "You were hired for this gig." : "The client hired someone else for this gig. Keep going, there are more gigs."}
          </Card>
        ) : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <p className="text-xs text-muted">Budget</p>
          <p className="text-3xl font-bold">{num(gig.budget)} <span className="text-base text-muted">USDC</span></p>
          <div className="mt-3 border-t border-line pt-2">
            <Row label="Applicants">{gig.applications.length}</Row>
            {gig.deadline && <Row label="Deadline">{new Date(gig.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</Row>}
            <Row label="Paid via">Escrow on Stellar</Row>
            <Row label="Asset">USDC</Row>
          </div>
          {canSeeProject && (
            <LinkButton href={`/p/${gig.projectId}`} full className="mt-4">Open project</LinkButton>
          )}
          {hired && !canSeeProject && <p className="mt-3 text-sm text-muted">This gig has been filled.</p>}
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted">Posted by</p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar address={gig.clientAddress} name={gig.client?.name} />
            <div className="min-w-0">
              <AddressLink address={gig.clientAddress} name={gig.client?.name} />
              <p className="truncate text-xs text-muted">{gig.client?.location || shortAddr(gig.clientAddress)}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-brand-soft/50 p-4 text-sm leading-relaxed">
          When the client hires, they lock the full amount in an escrow contract before work starts. Each share is paid to that member&apos;s wallet after approval.
        </Card>
      </aside>
    </div>
  );
}
