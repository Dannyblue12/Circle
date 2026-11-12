"use client";

import { useRouter } from "next/navigation";
import { api } from "./api-client";
import { Button, ErrorNote } from "./ui";
import { useAction } from "./wallet";

export function HireButton({ gigId, applicationId, total }: { gigId: string; applicationId: string; total: number }) {
  const router = useRouter();
  const { busy, error, run } = useAction();
  return (
    <div className="space-y-2">
      <Button
        busy={busy}
        onClick={() =>
          run(async () => {
            const { projectId } = await api<{ projectId: string }>(`/api/gigs/${gigId}/hire`, { applicationId });
            router.push(`/p/${projectId}`);
          })
        }
      >
        Hire · {total} USDC
      </Button>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

export function CloseGigButton({ gigId }: { gigId: string }) {
  const router = useRouter();
  const { busy, error, run } = useAction();
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        size="sm"
        busy={busy}
        onClick={() =>
          run(async () => {
            await api(`/api/gigs/${gigId}/close`);
            router.refresh();
          })
        }
      >
        Close gig
      </Button>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}
