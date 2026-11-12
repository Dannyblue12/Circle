import { cookies } from "next/headers";
import { z } from "zod";
import { buildChallenge } from "@/lib/auth-challenge";
import { handle, json } from "@/lib/api";
import { CHALLENGE_COOKIE } from "@/lib/session";
import { signPayload } from "@/lib/signed";

export const POST = handle(async (req: Request) => {
  const { address } = z.object({ address: z.string().regex(/^G[A-Z2-7]{55}$/) }).parse(await req.json());
  const { xdr, nonce } = buildChallenge(address);
  (await cookies()).set(CHALLENGE_COOKIE, signPayload({ a: address, n: nonce }, 5 * 60 * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });
  return json({ xdr });
});
