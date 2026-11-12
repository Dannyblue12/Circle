import { Container, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <Container narrow className="py-24 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <p className="mt-2 text-lg font-semibold">We couldn&apos;t find that page</p>
      <p className="mt-1 text-muted">The link may be wrong, or the gig was removed.</p>
      <LinkButton href="/gigs" className="mt-6">Browse gigs</LinkButton>
    </Container>
  );
}
