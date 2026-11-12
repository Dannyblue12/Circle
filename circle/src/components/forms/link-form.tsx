"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrigin } from "../use-origin";
import { shortAddr } from "@/lib/format";
import { api } from "../api-client";
import { Button, Card, ErrorNote, Row } from "../ui";
import { useAction, useWallet } from "../wallet";

export function LinkForm() {
  const { address } = useWallet();
  const { busy, error, run } = useAction();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();

  if (created) {
    const url = `${origin}/pay/${created}`;
    const text = `Pay ${amount} USDC for ${description} on Stellar: ${url}`;
    return (
      <Card className="space-y-4 p-5 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-xl text-brand">✓</span>
        <p className="text-lg font-bold">Your pay link is ready</p>
        <div className="flex items-center gap-2 rounded-xl bg-canvas p-2 pl-3.5 text-left">
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{url.replace(/^https?:\/\//, "")}</span>
          <Button size="sm" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); }}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          Share on WhatsApp
        </a>
        <Link href={`/pay/${created}`} className="block text-sm font-semibold text-brand">Open link</Link>
      </Card>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const { id } = await api<{ id: string }>("/api/links", { amount: Number(amount), description });
          setCreated(id);
        });
      }}
    >
      <div>
        <label className="label" htmlFor="amount">Amount (USDC)</label>
        <input id="amount" className="input py-4 text-3xl font-bold" inputMode="decimal" placeholder="5.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} required />
      </div>
      <div>
        <label className="label" htmlFor="for">What is it for?</label>
        <input id="for" className="input" placeholder="Flyer design" value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={80} />
      </div>
      <Card className="p-4">
        <Row label="Paid to" mono>{shortAddr(address)} (you)</Row>
        <Row label="Network and asset">Stellar · USDC</Row>
        <Row label="Can be paid">Once</Row>
      </Card>
      <p className="text-sm text-muted">No escrow: money goes straight to you. Use a project for bigger jobs or new clients.</p>
      <ErrorNote>{error}</ErrorNote>
      <Button type="submit" size="lg" full busy={busy}>Create link</Button>
    </form>
  );
}
