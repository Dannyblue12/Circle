"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CATEGORIES, SKILL_SUGGESTIONS, type Category } from "@/lib/categories";
import { num, splitSkills } from "@/lib/format";
import { GIG_TEMPLATES } from "@/lib/gig-templates";
import { api } from "../api-client";
import { GigCard } from "../gig-card";
import { useToast } from "../toast";
import { Button, Card, ErrorNote, cx } from "../ui";
import { useAction, useWallet } from "../wallet";

type Form = { title: string; description: string; category: Category; skills: string; budget: string; deadline: string };
const EMPTY: Form = { title: "", description: "", category: "Design", skills: "", budget: "", deadline: "" };
const BUDGET_PICKS = [25, 50, 100, 250];
const DEADLINE_PICKS = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];

/** yyyy-mm-dd in the person's own timezone, for <input type="date">. */
function dateInDays(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const chip = (on: boolean) =>
  cx(
    "rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95",
    on ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-muted hover:border-brand/40 hover:text-ink",
  );

export function GigForm() {
  const router = useRouter();
  const toast = useToast();
  const { address, name } = useWallet();
  const { busy, error, run } = useAction();
  const [f, setF] = useState<Form>(EMPTY);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const applyTemplate = (t: (typeof GIG_TEMPLATES)[number]) => {
    const prev = f;
    setF({ title: t.title, description: t.description, category: t.category, skills: t.skills, budget: String(t.budget), deadline: dateInDays(t.days) });
    const dirty = Object.entries(prev).some(([k, v]) => k !== "category" && v);
    toast(`Filled in from “${t.label}”. Replace the [brackets] with your details.`, {
      tone: "info",
      action: dirty ? { label: "Undo", onClick: () => setF(prev) } : undefined,
    });
  };

  const titleLen = f.title.trim().length;
  const descLen = f.description.trim().length;
  const preview = {
    id: "preview",
    clientAddress: address || "GPREVIEW",
    client: { name: name || "You" },
    title: f.title.trim(),
    description: f.description.trim(),
    category: f.category,
    skills: f.skills,
    budget: Number(f.budget) || 0,
    deadline: f.deadline ? new Date(`${f.deadline}T23:59:00`) : null,
    status: "OPEN" as const,
    projectId: null,
    demo: false,
    applicants: 0,
    createdAt: new Date(0),
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const { id } = await api<{ id: string }>("/api/gigs", { ...f, budget: Number(f.budget), deadline: f.deadline || undefined });
            toast("Gig posted. Share the link to get applicants faster.");
            router.push(`/gigs/${id}`);
          });
        }}
        className="min-w-0 space-y-5"
      >
        <div>
          <p className="label">Start from an example</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {GIG_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t)}
                className="shrink-0 rounded-full border border-dashed border-brand/40 bg-white px-3.5 py-1.5 text-sm font-medium text-ink transition hover:border-brand hover:bg-brand-soft/50 active:scale-95"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" className="input" placeholder="e.g. Brand kit for a bakery in Uyo" value={f.title} onChange={set("title")} required minLength={5} maxLength={100} />
            <p className="hint flex justify-between">
              <span>Say what you need and for whom. Specific titles get better applicants.</span>
              <span className="tabular-nums">{titleLen}/100</span>
            </p>
          </div>
          <div>
            <label className="label" htmlFor="description">What do you need?</label>
            <textarea
              id="description"
              className="input min-h-40"
              placeholder="Describe the deliverables, the style you want, files you need, and anything applicants should include."
              value={f.description}
              onChange={set("description")}
              required
              minLength={20}
              maxLength={4000}
            />
            <p className={cx("hint flex justify-between", descLen > 0 && descLen < 20 && "text-amber-ink")}>
              <span>{descLen < 20 ? `At least 20 characters${descLen ? ` (${20 - descLen} to go)` : ""}` : "Tip: list the deliverables so quotes are easy to compare."}</span>
              <span className="tabular-nums">{descLen}/4000</span>
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select id="category" className="input" value={f.category} onChange={set("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="budget">Budget (USDC)</label>
              <div className="relative">
                <input
                  id="budget"
                  className="input pr-14 font-semibold"
                  inputMode="decimal"
                  placeholder="30"
                  value={f.budget}
                  onChange={(e) => setF({ ...f, budget: e.target.value.replace(/[^0-9.]/g, "") })}
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">USDC</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BUDGET_PICKS.map((b) => (
                  <button key={b} type="button" className={chip(Number(f.budget) === b)} onClick={() => setF({ ...f, budget: String(b) })}>
                    {num(b)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="skills">Skills</label>
            <SkillsInput value={f.skills} onChange={(skills) => setF({ ...f, skills })} suggestions={SKILL_SUGGESTIONS[f.category] ?? []} />
          </div>
          <div>
            <label className="label" htmlFor="deadline">Deadline <span className="font-normal text-muted">(optional)</span></label>
            <div className="flex flex-wrap items-center gap-2">
              <input id="deadline" type="date" className="input w-auto" value={f.deadline} onChange={set("deadline")} />
              {DEADLINE_PICKS.map((d) => (
                <button key={d.label} type="button" className={chip(false)} onClick={() => setF({ ...f, deadline: dateInDays(d.days) })}>
                  {d.label}
                </button>
              ))}
              {f.deadline && (
                <button type="button" className="text-xs font-semibold text-muted hover:text-ink" onClick={() => setF({ ...f, deadline: "" })}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </Card>

        <details className="group rounded-2xl border border-line bg-white lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-semibold">
            Preview how it looks
            <span className="text-muted transition group-open:rotate-180" aria-hidden>▾</span>
          </summary>
          <div className="px-4 pb-4">
            <GigCard gig={preview} preview />
          </div>
        </details>

        <Card className="bg-brand-soft/50 p-4 text-sm text-ink">
          You only pay when you hire. Hiring creates an escrow on Stellar: you lock the USDC, and each share is released only after you approve that milestone.
        </Card>
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" size="lg" full busy={busy}>
          Post gig{Number(f.budget) > 0 ? ` · ${num(Number(f.budget))} USDC` : ""}
        </Button>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Live preview</p>
          <GigCard gig={preview} preview />
          <ul className="space-y-2 rounded-2xl border border-line bg-white p-4 text-sm text-muted">
            <li><b className="text-ink">Clear deliverables</b> get quotes you can compare.</li>
            <li><b className="text-ink">Teams can apply</b> with a split: each member is paid to their own wallet.</li>
            <li><b className="text-ink">Nothing is charged</b> until you hire and lock the escrow.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

/** Skills as removable chips. Enter or comma adds one; Backspace on an empty field removes the last. */
function SkillsInput({ value, onChange, suggestions }: { value: string; onChange: (v: string) => void; suggestions: string[] }) {
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const skills = splitSkills(value);
  const has = (s: string) => skills.some((x) => x.toLowerCase() === s.toLowerCase());
  const add = (items: string[]) => {
    const next = [...skills];
    for (const raw of items) {
      const s = raw.trim().slice(0, 30);
      if (s && !next.some((x) => x.toLowerCase() === s.toLowerCase()) && next.length < 10) next.push(s);
    }
    onChange(next.join(", "));
  };
  const remove = (i: number) => onChange(skills.filter((_, j) => j !== i).join(", "));
  const left = suggestions.filter((s) => !has(s)).slice(0, 6);

  return (
    <div>
      <div
        className="flex min-h-[46px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-2 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15"
        onClick={() => input.current?.focus()}
      >
        {skills.map((s, i) => (
          <span key={s} className="fade-in inline-flex items-center gap-1 rounded-md bg-brand-soft py-0.5 pl-2 pr-1 text-sm font-medium text-brand">
            {s}
            <button type="button" onClick={() => remove(i)} className="grid size-4 place-items-center rounded text-brand/70 hover:bg-brand/10 hover:text-brand" aria-label={`Remove ${s}`}>
              ×
            </button>
          </span>
        ))}
        <input
          ref={input}
          id="skills"
          value={draft}
          onChange={(e) => {
            const parts = e.target.value.split(",");
            if (parts.length > 1) {
              add(parts.slice(0, -1));
              setDraft(parts[parts.length - 1]);
            } else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add([draft]);
              setDraft("");
            } else if (e.key === "Backspace" && !draft && skills.length) {
              remove(skills.length - 1);
            }
          }}
          onBlur={() => {
            if (!draft.trim()) return;
            add([draft]);
            setDraft("");
          }}
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-[15px] outline-none placeholder:text-muted/70"
          placeholder={skills.length ? "Add another…" : "Type a skill and press Enter"}
          aria-describedby="skills-hint"
        />
      </div>
      {left.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5" id="skills-hint">
          <span className="text-xs text-muted">Suggested:</span>
          {left.map((s) => (
            <button key={s} type="button" className={chip(false)} onClick={() => add([s])}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
