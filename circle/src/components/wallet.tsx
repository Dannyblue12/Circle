"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NETWORK_PASSPHRASE } from "@/lib/config";
import { shortAddr } from "@/lib/format";
import { api, errorMessage } from "./api-client";

type Kit = import("./wallet-kit").Kit;
type Me = { address: string | null; user: { name: string } | null; admin: boolean };

let kitPromise: Promise<Kit> | null = null;

/** Stellar Wallets Kit is browser-only, so load it on first use (see wallet-kit.ts for the wallet list). */
function getKit(): Promise<Kit> {
  kitPromise ??= loadKit().catch((e: unknown) => {
    // Don't remember the failure, so the next click tries again instead of failing forever.
    kitPromise = null;
    if (!isStaleBundleError(e)) throw e;
    // The tab is running code from an older build than the server has (it stayed open while
    // the app was updated or the dev server restarted, or the browser cached old files).
    // Reloading fetches the current code; the pending promise just waits for the reload.
    if (reloadOnce()) return new Promise<never>(() => {});
    throw new Error("Circle was updated while this page was open. Reload the page (Ctrl+Shift+R) and try again.");
  });
  return kitPromise;
}

// async, so an error thrown while starting the import() becomes a rejection getKit can handle.
async function loadKit(): Promise<Kit> {
  const { createKit } = await import("./wallet-kit");
  return createKit(NETWORK_PASSPHRASE);
}

/** Errors the browser bundle throws when it can't find code it expects (an outdated tab or cache). */
function isStaleBundleError(e: unknown): boolean {
  if (e instanceof Error && e.name === "ChunkLoadError") return true;
  return /module factory is not available|failed to load chunk|loading (css )?chunk [\w-]+ failed|failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i.test(
    errorMessage(e),
  );
}

const RELOAD_KEY = "circle:stale-bundle-reload";

/** Reloads the page, at most once a minute, so a page that keeps failing can't loop. Returns true if it reloaded. */
function reloadOnce(): boolean {
  try {
    if (Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) || 0) < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false; // storage blocked: show the message instead of risking a reload loop
  }
  window.location.reload();
  return true;
}

type WalletCtx = {
  /** Signed-in wallet (session cookie), or null. */
  address: string | null;
  name: string;
  admin: boolean;
  ready: boolean;
  /** Pick a wallet and sign in to Circle (one signature, never submitted). */
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  /** Pick a wallet without signing in. Used by pay links. */
  pickWallet: () => Promise<string>;
  /** Ask the wallet to sign a transaction. If `expected` is given, the wallet must be that account. */
  signXdr: (xdr: string, expected?: string | null) => Promise<string>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me>({ address: null, user: null, admin: false });
  const [ready, setReady] = useState(false);

  const refresh = useCallback(
    () =>
      api<Me>("/api/me", undefined, "GET")
        .catch((): Me => ({ address: null, user: null, admin: false }))
        .then((me) => {
          setMe(me);
          setReady(true);
        }),
    [],
  );

  useEffect(() => {
    let live = true;
    api<Me>("/api/me", undefined, "GET")
      .catch((): Me => ({ address: null, user: null, admin: false }))
      .then((me) => {
        if (!live) return;
        setMe(me);
        setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const pickWallet = useCallback(async () => {
    const kit = await getKit();
    const { address } = await kit.authModal();
    return address;
  }, []);

  const signXdr = useCallback(async (xdr: string, expected?: string | null) => {
    const kit = await getKit();
    let current: string | null = null;
    try {
      current = (await kit.getAddress()).address;
    } catch {
      current = null;
    }
    if (!current || (expected && current !== expected)) current = (await kit.authModal()).address;
    if (expected && current !== expected) {
      throw new Error(`Switch your wallet to ${shortAddr(expected)} — that's the account signed in to Circle.`);
    }
    const { signedTxXdr } = await kit.signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE, address: current });
    return signedTxXdr;
  }, []);

  const connect = useCallback(async () => {
    const address = await pickWallet();
    const { xdr } = await api<{ xdr: string }>("/api/auth/challenge", { address });
    const signedXdr = await signXdr(xdr, address);
    await api("/api/auth/verify", { signedXdr });
    await refresh();
    router.refresh();
    return address;
  }, [pickWallet, signXdr, refresh, router]);

  const disconnect = useCallback(async () => {
    await api("/api/auth/logout");
    try {
      await (await getKit()).disconnect();
    } catch {}
    await refresh();
    router.push("/");
    router.refresh();
  }, [refresh, router]);

  const value = useMemo<WalletCtx>(
    () => ({
      address: me.address,
      name: me.user?.name || "",
      admin: me.admin,
      ready,
      connect,
      disconnect,
      pickWallet,
      signXdr,
      refresh,
    }),
    [me, ready, connect, disconnect, pickWallet, signXdr, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

/** Runs an async action with busy + error state. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const msg = errorMessage(e);
      setError(/reject|declin|cancel|closed/i.test(msg) ? "You cancelled in your wallet." : msg);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
}
