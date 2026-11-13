"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { IS_TESTNET } from "@/lib/config";
import { shortAddr } from "@/lib/format";
import { useAction, useWallet } from "./wallet";
import { Avatar, Button, cx } from "./ui";

const NAV = [
  { href: "/gigs", label: "Find gigs" },
  { href: "/talent", label: "Talent" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pitch", label: "Pitch" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
          <circle cx="12" cy="12" r="7" />
        </svg>
      </span>
      <span className="text-[17px]">Circle</span>
    </Link>
  );
}

function NavLinks({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <NavList pathname={pathname} mobile={mobile} />;
}

function NavList({ pathname, mobile }: { pathname: string | null; mobile?: boolean }) {
  return (
    <>
      {NAV.map((n) => {
        const active = !!pathname?.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={cx(
              "whitespace-nowrap rounded-lg px-3 text-sm font-medium transition",
              mobile ? "py-1" : "py-1.5",
              active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteHeader() {
  const { address, name, admin, ready, connect, disconnect } = useWallet();
  const { busy, error, run, setError } = useAction();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error, setError]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        {IS_TESTNET && <span className="hidden rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-amber-ink sm:inline">Testnet</span>}
        <nav className="hidden items-center gap-1 md:flex">
          <Suspense fallback={<NavList pathname={null} />}>
            <NavLinks />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {!ready ? null : address ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-medium hover:border-brand/40"
              >
                <Avatar address={address} name={name} size={28} />
                <span className="max-w-28 truncate">{name || shortAddr(address)}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 text-sm shadow-lg" onClick={() => setOpen(false)}>
                  <p className="px-3.5 py-2 font-mono text-xs text-muted">{shortAddr(address, 6)}</p>
                  <MenuLink href="/dashboard">Dashboard</MenuLink>
                  <MenuLink href={`/u/${address}`}>My profile</MenuLink>
                  <MenuLink href="/profile">Edit profile</MenuLink>
                  <MenuLink href="/gigs/new">Post a gig</MenuLink>
                  <MenuLink href="/links/new">Quick pay link</MenuLink>
                  {admin && <MenuLink href="/admin">Disputes (admin)</MenuLink>}
                  <button onClick={() => disconnect()} className="block w-full px-3.5 py-2 text-left text-red-ink hover:bg-red-soft">
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" busy={busy} onClick={() => run(connect)}>
              Connect wallet
            </Button>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        <Suspense fallback={<NavList pathname={null} mobile />}>
          <NavLinks mobile />
        </Suspense>
      </nav>
      {error && <div className="bg-red-soft px-4 py-2 text-center text-sm text-red-ink">{error}</div>}
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-3.5 py-2 hover:bg-canvas">
      {children}
    </Link>
  );
}
