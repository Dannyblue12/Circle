"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isStellarAddress } from "@/lib/format";
import { api } from "../api-client";
import { MilestoneEditor, emptyRow, rowsToPayload, type MilestoneRow } from "../milestone-editor";
import { Button, Card, ErrorNote } from "../ui";
import { useAction, useWallet } from "../wallet";

export function ProjectForm() {
  const router = useRouter();
  const { address, name } = useWallet();
  const { busy, error, run } = useAction();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [client, setClient] = useState("");
  const [rows, setRows] = useState<MilestoneRow[]>([emptyRow(name || "Me", address ?? ""), emptyRow()]);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const { id } = await api<{ id: string }>("/api/projects", {
            title,
            description,
            clientAddress: client,
            milestones: rowsToPayload(rows.filter((r) => r.description || r.receiver || r.amount)),
          });
          router.push(`/p/${id}`);
        });
      }}
    >
      <Card className="space-y-4 p-5">
        <div>
          <label className="label" htmlFor="title">Project title</label>
          <input id="title" className="input" placeholder="Brand kit · Uyo Bakery" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="desc">Short description (optional)</label>
          <input id="desc" className="input" placeholder="Logo, illustrations and packaging mockups" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="client">Client wallet (approves work)</label>
          <input id="client" className="input font-mono text-xs" placeholder="G… paste the client's Stellar address" value={client} onChange={(e) => setClient(e.target.value.trim())} required />
          {client && !isStellarAddress(client) && <p className="mt-1 text-xs text-red-ink">That doesn&apos;t look like a Stellar address.</p>}
        </div>
      </Card>
      <MilestoneEditor rows={rows} onChange={setRows} />
      <ErrorNote>{error}</ErrorNote>
      <Button type="submit" size="lg" full busy={busy}>
        Save project
      </Button>
      <p className="text-center text-xs text-muted">Next you&apos;ll create the escrow (one signature) and get a link for your client.</p>
    </form>
  );
}
