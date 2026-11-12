import Link from "next/link";
import type { Gig, User } from "@/lib/db/schema";
import { dueLabel, isNew, num, shortAddr, splitSkills, timeAgo } from "@/lib/format";
import { SaveGigButton } from "./saved-gigs";
import { Avatar, Badge, Card, cx } from "./ui";

export type GigCardData = Gig & { applicants: number; client: Pick<User, "name"> | null };

/**
 * Works in server and client components. The whole card is one link (stretched over the title),
 * with the save button layered above it.
 */
export function GigCard({ gig, preview }: { gig: GigCardData; preview?: boolean }) {
  const skills = splitSkills(gig.skills).slice(0, 4);
  const due = gig.status === "OPEN" ? dueLabel(gig.deadline) : null;
  const fresh = preview || isNew(gig.createdAt);
  return (
    <Card
      className={cx(
        "group relative flex h-full flex-col p-5 transition duration-200",
        !preview && "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_8px_24px_-12px_rgb(12_121_79/0.35)] focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar address={gig.clientAddress} name={gig.client?.name} size={32} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{gig.client?.name || shortAddr(gig.clientAddress)}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span suppressHydrationWarning>{preview ? "Just now" : timeAgo(gig.createdAt)}</span>
              {fresh && <span className="rounded bg-blue-soft px-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-ink">New</span>}
            </p>
          </div>
        </div>
        <div className="-mr-2 -mt-1.5 flex items-center gap-1">
          {gig.demo && (
            <span title="Sample gig added to show how Circle works" className="rounded-full border border-dashed border-line px-2 py-0.5 text-[11px] font-medium text-muted">
              Sample
            </span>
          )}
          {!preview && <SaveGigButton gigId={gig.id} className="relative z-10" />}
        </div>
      </div>
      <h3 className="mt-3 line-clamp-2 text-[16px] font-semibold leading-snug group-hover:text-brand">
        {preview ? (
          gig.title || <span className="text-muted">Your gig title</span>
        ) : (
          <Link href={`/gigs/${gig.id}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']">
            {gig.title}
          </Link>
        )}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{gig.description || (preview ? "What you need, in a sentence or two." : "")}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-brand-soft/70 px-2 py-0.5 text-xs font-medium text-brand">{gig.category}</span>
        {skills.map((s) => (
          <span key={s} className="rounded-md bg-canvas px-2 py-0.5 text-xs text-muted">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div>
          <p className="text-lg font-bold">
            {gig.budget ? num(gig.budget) : "—"} <span className="text-sm font-semibold text-muted">USDC</span>
          </p>
          <p className={cx("text-xs", gig.status === "OPEN" && gig.applicants === 0 ? "font-medium text-brand" : "text-muted")}>
            {gig.status === "OPEN" && gig.applicants === 0
              ? "Be the first to apply"
              : `${gig.applicants} ${gig.applicants === 1 ? "applicant" : "applicants"}`}
          </p>
        </div>
        {gig.status === "HIRED" ? (
          <Badge tone="blue">Hired</Badge>
        ) : gig.status === "CLOSED" ? (
          <Badge>Closed</Badge>
        ) : due ? (
          <Badge tone={due.tone}>
            <ClockIcon />
            <span suppressHydrationWarning>{due.text}</span>
          </Badge>
        ) : (
          <Badge tone="green">Open</Badge>
        )}
      </div>
    </Card>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
