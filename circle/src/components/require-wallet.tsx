"use client";

import { useWallet, useAction } from "./wallet";
import { Button, Card, ErrorNote, Skeleton } from "./ui";

/** Shows a connect prompt until the user has signed in with their wallet. */
export function RequireWallet({ children, title = "Connect your wallet to continue", text }: { children: React.ReactNode; title?: string; text?: string }) {
  const { address, ready, connect } = useWallet();
  const { busy, error, run } = useAction();
  if (!ready) return <Skeleton className="h-48" />;
  if (address) return <>{children}</>;
  return (
    <Card className="p-6 text-center sm:p-8">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        {text || "Circle uses your Stellar wallet as your account. You'll sign one message to prove it's you. Nothing is sent and no fee is charged."}
      </p>
      <div className="mx-auto mt-5 max-w-xs space-y-3">
        <Button full size="lg" busy={busy} onClick={() => run(connect)}>
          Connect Varial wallet
        </Button>
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Card>
  );
}
