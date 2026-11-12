"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { BUDGETS, NO_FILTERS, SORTS, activeFilterCount, applyFilters, filtersToQuery, parseFilters, type GigFilters } from "@/lib/gig-filters";
import { GigCard, type GigCardData } from "./gig-card";
import { HeartIcon, useSavedGigs } from "./saved-gigs";
import { buttonClass, cx } from "./ui";

export const LAST_GIGS_QUERY_KEY = "circle:gigs-query";

/**
 * Search, filter and sort open gigs instantly in the browser. The URL follows along
 * (replaceState, no reload), so a filtered list can be shared or reloaded.
 */
export function GigBrowser({ gigs, initial }: { gigs: GigCardData[]; initial: GigFilters }) {
  const [f, setF] = useState(initial);
  const { saved } = useSavedGigs();
  const search = useRef<HTMLInputElement>(null);
  const { list, counts } = useMemo(() => applyFilters(gigs, f, saved), [gigs, f, saved]);
  const active = activeFilterCount(f);

  const update = (patch: Partial<GigFilters>) => {
    const next = { ...f, ...patch };
    setF(next);
    const qs = filtersToQuery(next);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    try {
      sessionStorage.setItem(LAST_GIGS_QUERY_KEY, qs);
    } catch {}
  };

  // Remember the list you came from, so "Back to results" on a gig page returns to it.
  useEffect(() => {
    try {
      sessionStorage.setItem(LAST_GIGS_QUERY_KEY, filtersToQuery(initial));
    } catch {}
  }, [initial]);

  useEffect(() => {
    // "/" jumps to search from anywhere on the page, like most marketplaces.
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      search.current?.focus();
    };
    // A link to this same page (the "Find gigs" tab, a category link) should apply its filters.
    // Next keeps this page's state on same-page navigations, so do it here.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      setF(parseFilters(url.searchParams));
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  const total = gigs.length;
  return (
    <>
      <div className="z-20 -mx-4 space-y-3 bg-canvas/95 px-4 pb-3 pt-1 backdrop-blur md:sticky md:top-16 md:-mx-6 md:px-6 md:pt-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon />
            <input
              ref={search}
              type="search"
              value={f.q}
              onChange={(e) => update({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key !== "Escape" || !f.q) return;
                e.preventDefault();
                update({ q: "" });
              }}
              className="input pl-10 pr-16 [&::-webkit-search-cancel-button]:hidden"
              placeholder="Search: logo, React, voice-over, Yoruba…"
              aria-label="Search gigs"
              autoComplete="off"
            />
            {f.q ? (
              <button
                type="button"
                onClick={() => {
                  update({ q: "" });
                  search.current?.focus();
                }}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                aria-label="Clear search"
              >
                ×
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-canvas px-1.5 font-mono text-[11px] text-muted sm:block">/</kbd>
            )}
          </div>
          <label className="relative shrink-0">
            <span className="sr-only">Sort by</span>
            <select
              value={f.sort}
              onChange={(e) => update({ sort: e.target.value as GigFilters["sort"] })}
              className="input h-full cursor-pointer appearance-none pr-9 text-sm font-medium"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </label>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Category">
          {["", ...CATEGORIES].map((c) => {
            const n = counts[c] ?? 0;
            const on = f.category === c;
            return (
              <button
                key={c || "all"}
                type="button"
                aria-pressed={on}
                onClick={() => update({ category: on && c ? "" : c })}
                className={cx(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition active:scale-95",
                  on ? "border-brand bg-brand text-white" : n ? "border-line bg-white hover:border-brand/40" : "border-line bg-white/60 text-muted/70",
                )}
              >
                {c || "All"}
                <span className={cx("rounded-full px-1.5 text-[11px] font-semibold tabular-nums", on ? "bg-white/20" : "bg-canvas text-muted")}>{n}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-line bg-white p-0.5" role="group" aria-label="Budget">
            {BUDGETS.map((b) => (
              <button
                key={b.id || "any"}
                type="button"
                aria-pressed={f.budget === b.id}
                onClick={() => update({ budget: b.id })}
                className={cx(
                  "whitespace-nowrap rounded-[10px] px-2.5 py-1 text-[13px] font-medium transition",
                  f.budget === b.id ? "bg-ink text-white" : "text-muted hover:text-ink",
                )}
              >
                {b.label}
                {b.id && <span className="hidden sm:inline"> USDC</span>}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={f.saved}
            onClick={() => update({ saved: !f.saved })}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] font-medium transition",
              f.saved ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-muted hover:text-ink",
            )}
          >
            <HeartIcon filled={f.saved} className="size-4" />
            Saved
            <span className="tabular-nums">{saved.length}</span>
          </button>
          <p className="ml-auto text-sm text-muted" aria-live="polite">
            {active ? (
              <>
                <b className="text-ink">{list.length}</b> of {total} open gigs
                <button type="button" onClick={() => update(NO_FILTERS)} className="ml-3 font-semibold text-brand hover:underline">
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <b className="text-ink">{total}</b> open {total === 1 ? "gig" : "gigs"}
              </>
            )}
          </p>
        </div>
      </div>

      {list.length ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((g) => (
            <div key={g.id} className="fade-in">
              <GigCard gig={g} />
            </div>
          ))}
        </div>
      ) : f.saved && !saved.length ? (
        <EmptyState title="No saved gigs yet">
          Tap the <HeartIcon className="inline size-4 align-[-3px] text-brand" /> on any gig to keep it here for later.
          <div className="mt-4">
            <button type="button" onClick={() => update({ saved: false })} className={buttonClass("secondary", "sm")}>
              Show all gigs
            </button>
          </div>
        </EmptyState>
      ) : (
        <EmptyState title={f.q ? `No open gigs match “${f.q.trim()}”` : "No open gigs match these filters"}>
          Try fewer words, another category or a different budget. Or post the gig you need done.
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" onClick={() => update(NO_FILTERS)} className={buttonClass("secondary", "sm")}>
              Clear filters
            </button>
            <Link href="/gigs/new" className={buttonClass("primary", "sm")}>
              Post a gig
            </Link>
          </div>
        </EmptyState>
      )}
    </>
  );
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fade-in mt-3 rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
