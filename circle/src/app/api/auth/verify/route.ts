import { cookies } from "next/headers";
import { z } from "zod";
import { verifyChallenge } from "@/lib/auth-challenge";
import { HttpError, handle, json } from "@/lib/api";
import { db, users } from "@/lib/db";
import { CHALLENGE_COOKIE, setSession } from "@/lib/session";
import { readPayload } from "@/lib/signed";

export const POST = handle(async (req: Request) => {
  const { signedXdr } = z.object({ signedXdr: z.string().min(10) }).parse(await req.json());
  const store = await cookies();
  const challenge = readPayload<{ a: string; n: string }>(store.get(CHALLENGE_COOKIE)?.value);
  if (!challenge) throw new HttpError(400, "Sign-in expired, try again");
  const error = verifyChallenge(signedXdr, challenge.a, challenge.n);
  if (error) throw new HttpError(401, error);
  store.delete(CHALLENGE_COOKIE);
  await db.insert(users).values({ address: challenge.a }).onConflictDoNothing();
  await setSession(challenge.a);
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.address, challenge.a) });
  return json({ address: challenge.a, user });
});
