"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NETWORK_PASSPHRASE } from "@/lib/config";
import { shortAddr } from "@/lib/format";
import { api, errorMessage } from "./api-client";

type Kit = typeof import("@creit.tech/stellar-wallets-kit/sdk").StellarWalletsKit;
type Me = { address: string | null; user: { name: string } | null; admin: boolean };

let kitPromise: Promise<Kit> | null = null;

/** Stellar Wallets Kit is browser-only, so load it on first use. Varial (formerly Freighter) is in the default modules. */
function getKit(): Promise<Kit> {
  if (!kitPromise) {
    kitPromise = (async () => {
      // Only Stellar wallets. The kit's defaultModules() also loads a MetaMask module that
      // throws "MetaMask extension not found" when MetaMask isn't installed.
      const [{ StellarWalletsKit }, { VarialModule }, { xBullModule }, { AlbedoModule }, { LobstrModule }, { HanaModule }, { RabetModule }] =
        await Promise.all([
          import("@creit.tech/stellar-wallets-kit/sdk"),
          import("@creit.tech/stellar-wallets-kit/modules/varial"),
          import("@creit.tech/stellar-wallets-kit/modules/xbull"),
          import("@creit.tech/stellar-wallets-kit/modules/albedo"),
          import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
          import("@creit.tech/stellar-wallets-kit/modules/hana"),
          import("@creit.tech/stellar-wallets-kit/modules/rabet"),
        ]);
      StellarWalletsKit.init({
        modules: [new VarialModule(), new xBullModule(), new AlbedoModule(), new LobstrModule(), new HanaModule(), new RabetModule()],
        network: NETWORK_PASSPHRASE as Parameters<Kit["setNetwork"]>[0],
      });
      return StellarWalletsKit;
    })();
  }
  return kitPromise;
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
