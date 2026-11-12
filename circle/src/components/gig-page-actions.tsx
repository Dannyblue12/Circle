"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { num } from "@/lib/format";
import { LAST_GIGS_QUERY_KEY } from "./gig-browser";
import { useToast } from "./toast";
import { buttonClass, cx } from "./ui";

/** Shares with the phone's share sheet where there is one, otherwise copies the link. */
export function ShareGigButton({ title, className, label = "Share" }: { title: string; className?: string; label?: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={cx("inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold transition hover:border-brand/40 active:scale-95", className)}
      onClick={async () => {
        const url = `${window.location.origin}${window.location.pathname}`;
        if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
          try {
            await navigator.share({ title, text: `${title} · paid in USDC through escrow on Circle`, url });
            return;
          } catch (e) {
            if (e instanceof Error && e.name === "AbortError") return; // closed the share sheet
          }
        }
        try {
          await navigator.clipboard.writeText(url);
          toast("Link copied. Paste it anywhere to share this gig.");
        } catch {
          toast("Couldn't copy. Copy the link from the address bar instead.", { tone: "error" });
        }
      }}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
      </svg>
      {label}
    </button>
  );
}

const noop = () => () => {};

/** "← All gigs", back to the search and filters you had, if any. */
export function BackToGigs() {
  const qs = useSyncExternalStore(
    noop,
    () => {
      try {
        return sessionStorage.getItem(LAST_GIGS_QUERY_KEY) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );
  return (
    <Link href={qs ? `/gigs?${qs}` : "/gigs"} className="mb-3 inline-flex text-sm font-medium text-muted hover:text-ink">
      ← {qs ? "Back to results" : "All gigs"}
    </Link>
  );
}

/**
 * The visible element with this id. Next keeps a few previous pages mounted but hidden,
 * so another gig's form with the same id can still be in the document.
 */
function visibleById(id: string) {
  return [...document.querySelectorAll<HTMLElement>(`[id="${id}"]`)].find((e) => e.offsetParent !== null) ?? null;
}

function scrollToForm(id: string) {
  const el = visibleById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
  // Put the cursor in the first field once the scroll lands.
  setTimeout(() => el?.querySelector<HTMLElement>("textarea, input, button")?.focus({ preventScroll: true }), 450);
}

/** A link that scrolls to the apply form and focuses its first field. */
export function ApplyLink({ targetId, className, children, tabIndex }: { targetId: string; className?: string; children: React.ReactNode; tabIndex?: number }) {
  return (
    <a
      href={`#${targetId}`}
      tabIndex={tabIndex}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        scrollToForm(targetId);
      }}
    >
      {children}
    </a>
  );
}

/** Phones: keeps "Apply" in reach while reading, and hides once the form is on screen. */
export function StickyApplyBar({ budget, targetId, label }: { budget: number; targetId: string; label: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = visibleById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting || e.boundingClientRect.top < 0), { rootMargin: "0px 0px -30% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);
  return (
    <div
      className={cx(
        "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur transition-transform duration-200 lg:hidden",
        hidden && "translate-y-full",
      )}
      aria-hidden={hidden}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Budget</p>
          <p className="font-bold">{num(budget)} USDC</p>
        </div>
        <ApplyLink targetId={targetId} tabIndex={hidden ? -1 : 0} className={buttonClass("primary", "md")}>
          {label}
        </ApplyLink>
      </div>
    </div>
  );
}
