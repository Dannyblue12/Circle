"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../api-client";
import { MilestoneEditor, emptyRow, rowsToPayload, type MilestoneRow } from "../milestone-editor";
import { useToast } from "../toast";
import { Button, Card, ErrorNote, cx } from "../ui";
import { useAction, useWallet } from "../wallet";

type Existing = { pitch: string; link: string; milestones: { description: string; memberName: string; receiver: string; amount: number }[] };

export function ApplyForm({ gigId, budget, existing }: { gigId: string; budget: number; existing?: Existing | null }) {
  const router = useRouter();
  const { address, name } = useWallet();
  const { busy, error, run } = useAction();
  const [pitch, setPitch] = useState(existing?.pitch ?? "");
  const [link, setLink] = useState(existing?.link ?? "");
  const [rows, setRows] = useState<MilestoneRow[]>(
    existing?.milestones.map((m) => ({ ...m, amount: String(m.amount) })) ?? [
      { ...emptyRow(name, address ?? ""), description: "Full delivery", amount: String(budget) },
    ],
  );
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  const pitchLen = pitch.trim().length;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api(`/api/gigs/${gigId}/apply`, { pitch, link, milestones: rowsToPayload(rows) });
          setSaved(true);
          toast(existing ? "Application updated" : "Application sent. Track it from your dashboard.");
          router.refresh();
        });
      }}
    >
      <Card className="space-y-5 p-5">
        <div>
          <label className="label" htmlFor="pitch">Why you (or your team)?</label>
          <textarea
            id="pitch"
            className="input"
            placeholder="Similar work you've done, how you'll approach it, and when you can deliver."
            value={pitch}
            onChange={(e) => {
              setPitch(e.target.value);
              setSaved(false);
            }}
            maxLength={2000}
            required
            aria-describedby="pitch-hint"
          />
          <p id="pitch-hint" className={cx("hint flex justify-between", pitchLen > 0 && pitchLen < 20 && "text-amber-ink")}>
            <span>{pitchLen < 20 ? `At least 20 characters (${20 - pitchLen} to go)` : "Specific examples win more work."}</span>
            <span className="tabular-nums">{pitchLen}/2000</span>
          </p>
        </div>
        <div>
          <label className="label" htmlFor="link">Portfolio link</label>
          <input id="link" className="input" placeholder="https://behance.net/… or github.com/…" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
      </Card>
      <div>
        <MilestoneEditor rows={rows} onChange={setRows} budget={budget} />
        <p className="hint mt-2">
          Working alone? Keep one milestone with your wallet. Applying as a team? Add one per member: the client&apos;s escrow pays each share straight to that member&apos;s wallet.
        </p>
      </div>
      <ErrorNote>{error}</ErrorNote>
      {saved && !error && <p className="rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm text-brand">Application sent. The client will see it on this page.</p>}
      <Button type="submit" size="lg" full busy={busy}>
        {existing ? "Update application" : "Send application"}
      </Button>
    </form>
  );
}
