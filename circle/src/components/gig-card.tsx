import Link from "next/link";
import type { Gig, User } from "@/lib/db/schema";
import { num, shortAddr, splitSkills, timeAgo } from "@/lib/format";
import { Avatar, Badge, Card } from "./ui";

export function GigCard({ gig }: { gig: Gig & { applicants: number; client: User | null } }) {
  const skills = splitSkills(gig.skills).slice(0, 4);
  return (
    <Link href={`/gigs/${gig.id}`} className="group block">
      <Card className="flex h-full flex-col p-5 transition group-hover:border-brand/40 group-hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar address={gig.clientAddress} name={gig.client?.name} size={32} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{gig.client?.name || shortAddr(gig.clientAddress)}</p>
              <p className="text-xs text-muted">{timeAgo(gig.createdAt)}</p>
            </div>
          </div>
          <Badge tone="gray">{gig.category}</Badge>
        </div>
        <h3 className="mt-3 line-clamp-2 text-[16px] font-semibold leading-snug group-hover:text-brand">{gig.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{gig.description}</p>
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="rounded-md bg-canvas px-2 py-0.5 text-xs text-muted">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-lg font-bold">{num(gig.budget)} <span className="text-sm font-semibold text-muted">USDC</span></p>
            <p className="text-xs text-muted">
              {gig.applicants} {gig.applicants === 1 ? "applicant" : "applicants"}
              {gig.deadline ? ` · due ${new Date(gig.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
            </p>
          </div>
          {gig.status === "OPEN" ? <Badge tone="green">Open</Badge> : gig.status === "HIRED" ? <Badge tone="blue">Hired</Badge> : <Badge>Closed</Badge>}
        </div>
      </Card>
    </Link>
  );
}
