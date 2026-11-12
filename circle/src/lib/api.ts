import "server-only";
import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { getSessionAddress } from "./session";
import { TrustlessWorkError } from "./trustless";

import { HttpError } from "./errors";

export { HttpError };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function requireAddress(): Promise<string> {
  const address = await getSessionAddress();
  if (!address) throw new HttpError(401, "Connect your wallet first");
  return address;
}

/** Wraps a route handler so thrown errors become clean JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      unstable_rethrow(e); // let Next.js handle its own control-flow errors (prerender bailouts, notFound…)
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof TrustlessWorkError) return json({ error: e.message }, e.status);
      if (e instanceof ZodError) return json({ error: e.issues.map((i) => i.message).join(", ") }, 400);
      console.error(e);
      const message = e instanceof Error ? e.message : "Something went wrong";
      return json({ error: message }, 500);
    }
  };
}
