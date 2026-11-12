import { ProjectForm } from "@/components/forms/project-form";
import { RequireWallet } from "@/components/require-wallet";
import { Container, PageHeader } from "@/components/ui";

export const metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <Container narrow>
      <PageHeader back="/dashboard" title="New project" subtitle="For a client you found yourself. Escrow + team split." />
      <RequireWallet>
        <ProjectForm />
      </RequireWallet>
    </Container>
  );
}
