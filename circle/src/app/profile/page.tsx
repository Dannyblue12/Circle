import { Suspense } from "react";
import { ProfileForm } from "@/components/forms/profile-form";
import { RequireWallet } from "@/components/require-wallet";
import { Container, PageHeader, Skeleton } from "@/components/ui";
import { getUser } from "@/lib/data";
import { getSessionAddress } from "@/lib/session";

export const metadata = { title: "Edit profile" };

export default function EditProfilePage() {
  return (
    <Container narrow>
      <PageHeader title="Your profile" subtitle="This is what clients see when you apply." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Form />
      </Suspense>
    </Container>
  );
}

async function Form() {
  const address = await getSessionAddress();
  if (!address) return <RequireWallet>{null}</RequireWallet>;
  const u = await getUser(address);
  return (
    <ProfileForm
      initial={{
        name: u?.name ?? "",
        headline: u?.headline ?? "",
        bio: u?.bio ?? "",
        category: u?.category ?? "",
        skills: u?.skills ?? "",
        location: u?.location ?? "",
        link: u?.link ?? "",
      }}
    />
  );
}
