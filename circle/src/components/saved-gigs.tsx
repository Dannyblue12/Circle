"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useToast } from "./toast";
import { cx } from "./ui";

// Saved gigs live in this browser only (no account needed to bookmark).
const KEY = "circle:saved-gigs";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let raw: string | null = null;
let cache: string[] = EMPTY;

function read(): string[] {
  try {
    const r = localStorage.getItem(KEY);
    if (r !== raw) {
      raw = r;
      const parsed: unknown = r ? JSON.parse(r) : [];
      cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : EMPTY;
    }
  } catch {
    // Storage blocked or bad JSON: behave as if nothing is saved.
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    raw = JSON.stringify(ids);
    localStorage.setItem(KEY, raw);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSavedGigs() {
  const saved = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const now = read();
    const on = !now.includes(id);
    write(on ? [id, ...now] : now.filter((x) => x !== id));
    return on;
  }, []);
  return { saved, toggle, isSaved: (id: string) => saved.includes(id) };
}

export function SaveGigButton({ gigId, className, withLabel }: { gigId: string; className?: string; withLabel?: boolean }) {
  const { isSaved, toggle } = useSavedGigs();
  const toast = useToast();
  const on = isSaved(gigId);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from saved gigs" : "Save gig"}
      title={on ? "Saved" : "Save for later"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowOn = toggle(gigId);
        toast(nowOn ? "Saved. Find it under Saved on Find gigs." : "Removed from saved", {
          tone: nowOn ? "success" : "info",
          action: nowOn ? undefined : { label: "Undo", onClick: () => toggle(gigId) },
        });
      }}
      className={cx(
        "group/save inline-flex items-center justify-center gap-1.5 rounded-full transition active:scale-90",
        withLabel ? "border border-line bg-white px-3.5 py-2 text-sm font-semibold hover:border-brand/40" : "size-9 hover:bg-canvas",
        on ? "text-brand" : "text-muted hover:text-ink",
        className,
      )}
    >
      <HeartIcon filled={on} />
      {withLabel && (on ? "Saved" : "Save")}
    </button>
  );
}

export function HeartIcon({ filled, className = "size-[18px]" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx(className, filled && "pop")} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
    </svg>
  );
}
