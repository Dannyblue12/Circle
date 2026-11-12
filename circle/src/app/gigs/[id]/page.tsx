import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApplyForm } from "@/components/forms/apply-form";
import { GigCard } from "@/components/gig-card";
import { ApplyLink, BackToGigs, ShareGigButton, StickyApplyBar } from "@/components/gig-page-actions";
import { CloseGigButton, HireButton } from "@/components/gig-owner-actions";
import { RequireWallet } from "@/components/require-wallet";
import { SaveGigButton } from "@/components/saved-gigs";
import { SplitBar } from "@/components/split-bar";
import { AddressLink, Avatar, Badge, Card, Container, Empty, LinkButton, Row, Skeleton, buttonClass, cx } from "@/components/ui";
import { getGig, similarGigs } from "@/lib/data";
import { dueLabel, num, shortAddr, shortDate, splitSkills, timeAgo } from "@/lib/format";
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
  const canApply = !isOwner && gig.status === "OPEN";
  const due = gig.status === "OPEN" ? dueLabel(gig.deadline) : null;
  const teams = gig.applications.filter((a) => new Set(a.milestones.map((m) => m.receiver)).size > 1).length;

  return (
    <div className={canApply ? "pb-20 lg:pb-0" : undefined}>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <BackToGigs />
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{gig.category}</Badge>
            {gig.status === "OPEN" ? <Badge tone="green">Open</Badge> : gig.status === "HIRED" ? <Badge tone="blue">Hired</Badge> : <Badge>Closed</Badge>}
            {gig.demo && (
              <span className="rounded-full border border-dashed border-line px-2 py-0.5 text-xs font-medium text-muted">Sample</span>
            )}
            <span className="text-xs text-muted">Posted {timeAgo(gig.createdAt)}</span>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{gig.title}</h1>
            <div className="flex shrink-0 gap-2">
              <ShareGigButton title={gig.title} />
              <SaveGigButton gigId={gig.id} withLabel />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {splitSkills(gig.skills).map((s) => (
              <span key={s} className="rounded-md bg-white px-2 py-0.5 text-xs text-muted ring-1 ring-line">{s}</span>
            ))}
          </div>
          <Card className="mt-5 whitespace-pre-line p-5 text-[15px] leading-relaxed">{gig.description}</Card>

          {gig.demo && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-dashed border-line bg-white/60 p-4 text-sm leading-relaxed">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-soft text-xs font-bold text-blue-ink" aria-hidden>i</span>
              <p className="text-muted">
                <b className="text-ink">This is a sample gig</b> that shows how Circle works. The client is a demo account, so nobody will be hired from it,
                but you can practise applying and building a team split. Ready for the real thing?{" "}
                <Link href="/gigs/new" className="font-semibold text-brand hover:underline">Post your own gig</Link>.
              </p>
            </div>
          )}

          {isOwner ? (
            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Applications ({gig.applications.length})</h2>
                {gig.status === "OPEN" && <CloseGigButton gigId={gig.id} />}
              </div>
              {gig.applications.length === 0 ? (
                <Empty title="No applications yet">
                  Share this page with people you&apos;d like to hire.
                  <div className="mt-4 flex justify-center">
                    <ShareGigButton title={gig.title} label="Copy link to this gig" />
                  </div>
                </Empty>
              ) : (
                <div className="space-y-4">
                  {gig.applications.map((a) => {
                    const size = new Set(a.milestones.map((m) => m.receiver)).size;
                    return (
                      <Card key={a.id} id={`app-${a.id}`} className="scroll-mt-24 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar address={a.leadAddress} name={a.lead?.name} />
                            <div>
                              <AddressLink address={a.leadAddress} name={a.lead?.name} />
                              <p className="text-xs text-muted">
                                {a.lead?.headline || shortAddr(a.leadAddress)} · {size > 1 ? `team of ${size}` : "solo"} · {timeAgo(a.createdAt)}
                              </p>
                            </div>
                          </div>
                          {a.status === "HIRED" ? <Badge tone="blue">Hired</Badge> : a.status === "REJECTED" ? <Badge>Not selected</Badge> : null}
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{a.pitch}</p>
                        {a.link && (
                          <a href={a.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand">Portfolio ↗</a>
                        )}
                        <QuoteBreakdown milestones={a.milestones} total={a.total} budget={gig.budget} />
                        {gig.status === "OPEN" && a.status === "PENDING" && (
                          <div className="mt-4">
                            <HireButton gigId={gig.id} applicationId={a.id} total={a.total} />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          ) : gig.status === "OPEN" ? (
            <section id="apply" className="mt-8 scroll-mt-24">
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
            {due && due.tone !== "gray" && (
              <p className={due.tone === "red" ? "mt-1 text-sm font-semibold text-red-ink" : "mt-1 text-sm font-semibold text-amber-ink"}>{due.text} to deliver</p>
            )}
            <div className="mt-3 border-t border-line pt-2">
              <Row label="Applicants">
                {gig.applications.length}
                {teams > 0 && <span className="font-normal text-muted"> · {teams} {teams === 1 ? "team" : "teams"}</span>}
              </Row>
              {gig.deadline && <Row label="Deadline">{shortDate(gig.deadline, true)}</Row>}
              <Row label="Paid via">Escrow on Stellar</Row>
              <Row label="Asset">USDC</Row>
            </div>
            {canApply && (
              <ApplyLink targetId="apply" className={cx(buttonClass("primary", "md", true), "mt-4 hidden lg:flex")}>
                {mine ? "Edit your application" : gig.applications.length === 0 ? "Be the first to apply" : "Apply now"}
              </ApplyLink>
            )}
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
                <p className="truncate text-xs text-muted">
                  {[gig.client?.headline, gig.client?.location].filter(Boolean).join(" · ") || shortAddr(gig.clientAddress)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-brand-soft/50 p-4 text-sm leading-relaxed">
            <p className="mb-2 font-semibold">How you get paid</p>
            <ol className="space-y-1.5 text-ink/80">
              {["The client hires and locks the full amount in escrow.", "You deliver and mark each milestone done with proof.", "The client approves and that share goes straight to the member's wallet."].map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>

      <Suspense fallback={null}>
        <MoreGigs gig={gig} />
      </Suspense>

      {canApply && <StickyApplyBar budget={gig.budget} targetId="apply" label={mine ? "Edit application" : "Apply now"} />}
    </div>
  );
}

function QuoteBreakdown({ milestones, total, budget }: { milestones: { description: string; memberName: string; receiver: string; amount: number }[]; total: number; budget: number }) {
  const team = new Set(milestones.map((m) => m.receiver)).size > 1;
  return (
    <div className="mt-4 rounded-xl bg-canvas p-3.5">
      {team && (
        <SplitBar className="mb-3" parts={milestones.map((m) => ({ key: m.receiver, label: m.memberName, amount: m.amount }))} />
      )}
      {milestones.map((m, i) => (
        <Row key={i} label={<>{m.description} · <span className="text-ink">{m.memberName}</span></>}>{num(m.amount)} USDC</Row>
      ))}
      <div className="mt-1 border-t border-line pt-1">
        <Row label="Total">
          {num(total)} USDC
          {total !== budget && (
            <span className={total > budget ? "ml-1.5 text-xs font-medium text-amber-ink" : "ml-1.5 text-xs font-medium text-brand"}>
              {total > budget ? `${num(total - budget)} over budget` : `${num(budget - total)} under budget`}
            </span>
          )}
        </Row>
      </div>
    </div>
  );
}

async function MoreGigs({ gig }: { gig: { id: string; category: string } }) {
  const more = await similarGigs(gig, 3);
  if (!more.length) return null;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-bold">More gigs like this</h2>
        <LinkButton href={`/gigs?category=${encodeURIComponent(gig.category)}`} variant="ghost" size="sm">
          All {gig.category} gigs →
        </LinkButton>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {more.map((g) => (
          <GigCard key={g.id} gig={g} />
        ))}
      </div>
    </section>
  );
}
