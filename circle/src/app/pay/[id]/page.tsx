import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PayLinkView } from "@/components/pay-link";
import { Container, Skeleton } from "@/components/ui";
import { getLink } from "@/lib/data";
import { shortAddr } from "@/lib/format";
import { getSessionAddress } from "@/lib/session";

type Params = Promise<{ id: string }>;

export default function PayPage({ params }: { params: Params }) {
  return (
    <Container narrow className="py-12">
      <Suspense fallback={<Skeleton className="h-96" />}>
        <PayView params={params} />
      </Suspense>
    </Container>
  );
}

async function PayView({ params }: { params: Params }) {
  const { id } = await params;
  const [link, viewer] = await Promise.all([getLink(id), getSessionAddress()]);
  if (!link) notFound();
  const { owner, ...rest } = link;
  return <PayLinkView link={rest} ownerName={owner?.name || shortAddr(link.ownerAddress)} viewer={viewer} />;
}
