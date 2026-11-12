"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { api } from "../api-client";
import { Button, Card, ErrorNote } from "../ui";
import { useAction, useWallet } from "../wallet";

type P = { name: string; headline: string; bio: string; category: string; skills: string; location: string; link: string };

export function ProfileForm({ initial }: { initial: P }) {
  const router = useRouter();
  const { address, refresh } = useWallet();
  const { busy, error, run } = useAction();
  const [f, setF] = useState<P>(initial);
  const set = (k: keyof P) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api("/api/profile", f, "PUT");
          await refresh();
          router.push(`/u/${address}`);
          router.refresh();
        });
      }}
    >
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" placeholder="Ada Okon" value={f.name} onChange={set("name")} required />
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" className="input" placeholder="Uyo, Nigeria" value={f.location} onChange={set("location")} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="headline">Headline</label>
          <input id="headline" className="input" placeholder="Brand designer · logos, packaging, social kits" value={f.headline} onChange={set("headline")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Main category</label>
            <select id="category" className="input" value={f.category} onChange={set("category")}>
              <option value="">Choose one</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="skills">Skills</label>
            <input id="skills" className="input" placeholder="Figma, Illustrator, branding" value={f.skills} onChange={set("skills")} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bio">About you</label>
          <textarea id="bio" className="input" placeholder="What you do, who you've worked with, how you like to work." value={f.bio} onChange={set("bio")} />
        </div>
        <div>
          <label className="label" htmlFor="link">Portfolio link</label>
          <input id="link" className="input" placeholder="https://" value={f.link} onChange={set("link")} />
        </div>
      </Card>
      <p className="text-xs text-muted">Your profile is stored by Circle, never on-chain. Don&apos;t add phone numbers or emails here.</p>
      <ErrorNote>{error}</ErrorNote>
      <Button type="submit" size="lg" full busy={busy}>Save profile</Button>
    </form>
  );
}
