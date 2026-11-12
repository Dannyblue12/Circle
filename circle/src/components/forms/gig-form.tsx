"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { api } from "../api-client";
import { Button, Card, ErrorNote } from "../ui";
import { useAction } from "../wallet";

export function GigForm() {
  const router = useRouter();
  const { busy, error, run } = useAction();
  const [f, setF] = useState({ title: "", description: "", category: "Design", skills: "", budget: "", deadline: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const { id } = await api<{ id: string }>("/api/gigs", { ...f, budget: Number(f.budget), deadline: f.deadline || undefined });
          router.push(`/gigs/${id}`);
        });
      }}
      className="space-y-5"
    >
      <Card className="space-y-5 p-5 sm:p-6">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input" placeholder="e.g. Brand kit for a bakery in Uyo" value={f.title} onChange={set("title")} required />
        </div>
        <div>
          <label className="label" htmlFor="description">What do you need?</label>
          <textarea id="description" className="input" placeholder="Describe the deliverables, the style you want, files you need, and anything applicants should include." value={f.description} onChange={set("description")} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" value={f.category} onChange={set("category")}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="skills">Skills</label>
            <input id="skills" className="input" placeholder="Figma, branding, packaging" value={f.skills} onChange={set("skills")} />
            <p className="hint">Comma separated</p>
          </div>
          <div>
            <label className="label" htmlFor="budget">Budget (USDC)</label>
            <input id="budget" className="input font-semibold" inputMode="decimal" placeholder="30" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value.replace(/[^0-9.]/g, "") })} required />
          </div>
          <div>
            <label className="label" htmlFor="deadline">Deadline (optional)</label>
            <input id="deadline" type="date" className="input" value={f.deadline} onChange={set("deadline")} />
          </div>
        </div>
      </Card>
      <Card className="bg-brand-soft/50 p-4 text-sm text-ink">
        You only pay when you hire. Hiring creates an escrow on Stellar: you lock the USDC, and each share is released only after you approve that milestone.
      </Card>
      <ErrorNote>{error}</ErrorNote>
      <Button type="submit" size="lg" full busy={busy}>
        Post gig
      </Button>
    </form>
  );
}
