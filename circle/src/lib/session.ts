import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { readPayload, signPayload } from "./signed";

export const SESSION_COOKIE = "circle_session";
export const CHALLENGE_COOKIE = "circle_challenge";
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

/** The wallet address of the signed-in user, or null. */
export async function getSessionAddress(): Promise<string | null> {
  await connection(); // the expiry check reads the clock, so never prerender this
  const store = await cookies();
  const data = readPayload<{ a: string }>(store.get(SESSION_COOKIE)?.value);
  return data?.a ?? null;
}

export async function setSession(address: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, signPayload({ a: address }, SESSION_TTL), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL / 1000,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
