import { handle, json } from "@/lib/api";
import { submitAction } from "@/lib/escrow";
import { readIntent } from "@/lib/intent";
import { getSessionAddress } from "@/lib/session";
import { submitSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const { intent, signedXdr } = submitSchema.parse(await req.json());
  const parsed = readIntent(intent, signedXdr, await getSessionAddress());
  return json(await submitAction(parsed, signedXdr));
});
