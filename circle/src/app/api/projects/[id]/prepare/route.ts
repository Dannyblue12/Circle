import { handle, json, requireAddress } from "@/lib/api";
import { prepareAction } from "@/lib/escrow";
import { prepareSchema } from "@/lib/validation";

/** Returns an unsigned transaction for the connected wallet to sign, plus an intent token. */
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const address = await requireAddress();
  const { id } = await params;
  const { action, ...body } = prepareSchema.parse(await req.json());
  return json(await prepareAction(id, action, address, body));
});
