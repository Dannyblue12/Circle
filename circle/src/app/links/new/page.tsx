import { LinkForm } from "@/components/forms/link-form";
import { RequireWallet } from "@/components/require-wallet";
import { Container, PageHeader } from "@/components/ui";

export const metadata = { title: "Quick pay link" };

export default function NewLinkPage() {
  return (
    <Container narrow>
      <PageHeader back="/dashboard" title="Quick pay link" subtitle="Small jobs, no escrow. The client can't get the network, asset or amount wrong." />
      <RequireWallet>
        <LinkForm />
      </RequireWallet>
    </Container>
  );
}
