import { GigForm } from "@/components/forms/gig-form";
import { RequireWallet } from "@/components/require-wallet";
import { Container, PageHeader } from "@/components/ui";

export const metadata = { title: "Post a gig" };

export default function NewGigPage() {
  return (
    <Container narrow>
      <PageHeader back="/gigs" title="Post a gig" subtitle="Anyone with the skill can apply, solo or as a team." />
      <RequireWallet title="Connect your wallet to post a gig">
        <GigForm />
      </RequireWallet>
    </Container>
  );
}
