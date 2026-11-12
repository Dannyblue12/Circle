import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { serverConfig } from "./server-config";

/** Tiny tamper-proof token: base64url(JSON payload) + "." + HMAC. Payloads carry their own expiry `e` (ms). */
export function signPayload(payload: Record<string, unknown>, ttlMs: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, e: Date.now() + ttlMs })).toString("base64url");
  return `${body}.${mac(body)}`;
}

export function readPayload<T extends Record<string, unknown>>(token: string | undefined | null): (T & { e: number }) | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = mac(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof data.e !== "number" || data.e < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function mac(body: string) {
  return createHmac("sha256", serverConfig.sessionSecret).update(body).digest("base64url");
}
