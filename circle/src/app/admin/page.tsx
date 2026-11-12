import Link from "next/link";
import { Suspense } from "react";
import { ResolveForm } from "@/components/resolve-form";
import { Badge, Card, Container, Empty, PageHeader, Row, Skeleton, TxLink } from "@/components/ui";
import { listDisputes } from "@/lib/data";
import { num } from "@/lib/format";
import { isAdmin } from "@/lib/server-config";
import { getSessionAddress } from "@/lib/session";

export const metadata = { title: "Disputes" };

export default function AdminPage() {
  return (
    <Container narrow>
      <PageHeader title="Disputes" subtitle="Admin screen. Only the dispute resolver role can move frozen funds." />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Disputes />
      </Suspense>
    </Container>
  );
}

async function Disputes() {
  const address = await getSessionAddress();
  if (!isAdmin(address)) return <Empty title="Admins only">Sign in with a wallet listed in ADMIN_ADDRESSES.</Empty>;
  const rows = await listDisputes();
  const open = rows.filter((r) => r.m.status === "DISPUTED");
  const done = rows.filter((r) => r.m.status === "RESOLVED");
  return (
    <div className="space-y-8">
      {open.length === 0 && <Empty title="No open disputes" />}
      {open.map(({ m, p }) => (
        <Card key={m.id} className="space-y-4 p-5">
          <div>
            <Link href={`/p/${p.id}`} className="text-sm font-semibold text-brand">{p.title} ↗</Link>
            <p className="font-semibold">{m.description} · {m.memberName}</p>
          </div>
          <div className="rounded-xl bg-red-soft p-3 text-sm text-red-ink">
            <p className="text-xs font-semibold">Raised by the {m.disputeBy === p.clientAddress ? "client" : "team lead"}</p>
            <p>“{m.disputeReason}”</p>
            <p className="mt-1 text-xs">{num(m.amount)} USDC frozen until resolved</p>
          </div>
          <ResolveForm projectId={p.id} idx={m.idx} amount={m.amount} memberName={m.memberName} />
        </Card>
      ))}
      {done.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">Resolved</h2>
          <Card className="divide-y divide-line">
            {done.map(({ m, p }) => (
              <div key={m.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{p.title} · {m.memberName}</p>
                  <Badge>Resolved</Badge>
                </div>
                <Row label="To member">{num(m.toReceiver ?? 0)} USDC</Row>
                <Row label="To client">{num(m.toClient ?? 0)} USDC</Row>
                <TxLink hash={m.resolveTx} />
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
