import { handle, json, requireAddress } from "@/lib/api";
import { db, payLinks } from "@/lib/db";
import { shortId } from "@/lib/ids";
import { linkSchema } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const address = await requireAddress();
  const data = linkSchema.parse(await req.json());
  const id = shortId(10); // also the payment memo, so it must stay ≤ 28 bytes
  await db.insert(payLinks).values({ id, ownerAddress: address, amount: Number(data.amount.toFixed(7)), description: data.description });
  return json({ id });
});
