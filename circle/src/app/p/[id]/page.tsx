import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectTracker } from "@/components/project-tracker";
import { Container, Skeleton } from "@/components/ui";
import { getProjectView } from "@/lib/data";
import { shortAddr } from "@/lib/format";
import { getSessionAddress } from "@/lib/session";
import { getBalances } from "@/lib/stellar-server";

type Params = Promise<{ id: string }>;

export default function ProjectPage({ params }: { params: Params }) {
  return (
    <Container narrow>
      <Suspense fallback={<Skeleton className="h-[520px]" />}>
        <ProjectView params={params} />
      </Suspense>
    </Container>
  );
}

async function ProjectView({ params }: { params: Params }) {
  const { id } = await params;
  const [project, viewer] = await Promise.all([getProjectView(id), getSessionAddress()]);
  if (!project) notFound();

  // Before funding, check every receiver can actually hold USDC, and show the client their balance.
  let clientUsdc: number | null = null;
  const missingTrustline: string[] = [];
  if (!project.funded) {
    const receivers = [...new Map(project.milestones.map((m) => [m.receiver, m.memberName])).entries()];
    const [clientBal, ...bals] = await Promise.all([getBalances(project.clientAddress), ...receivers.map(([a]) => getBalances(a))]);
    clientUsdc = clientBal ? clientBal.usdc : null;
    bals.forEach((b, i) => {
      if (b && !b.usdcTrustline) missingTrustline.push(receivers[i][1]);
    });
  }

  const clientName = project.client?.name || shortAddr(project.clientAddress);
  const leadName = project.lead?.name || shortAddr(project.leadAddress);
  return (
    <>
      <div className="mb-5">
        <Link href={viewer ? "/dashboard" : "/"} className="text-sm font-medium text-muted hover:text-ink">← {viewer ? "Dashboard" : "Home"}</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{project.title}</h1>
        <p className="text-sm text-muted">
          {project.gigId ? (
            <Link href={`/gigs/${project.gigId}`} className="hover:text-brand">From a Circle gig</Link>
          ) : (
            "Direct project"
          )}{" "}
          · {project.milestones.length} {project.milestones.length === 1 ? "milestone" : "milestones"} · lead {leadName}
        </p>
      </div>
      <ProjectTracker
        project={project}
        clientName={clientName}
        leadName={leadName}
        viewer={viewer}
        clientUsdc={clientUsdc}
        missingTrustline={missingTrustline}
      />
    </>
  );
}
