import { Account, Asset, Keypair, Memo, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { checkLinkPayment, parseTx } from "../../src/lib/stellar-server";
const pass = "Test SDF Network ; September 2015";
const USDC = new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
const FAKE = new Asset("USDC", Keypair.random().publicKey());
const payer = Keypair.random(); const owner = Keypair.random().publicKey();
const link = { id: "k3x9q2abcd", ownerAddress: owner, amount: 5 };
function tx(opts: { asset?: Asset; dest?: string; amount?: string; memo?: string }) {
  const t = new TransactionBuilder(new Account(payer.publicKey(), "10"), { fee: "100", networkPassphrase: pass })
    .addOperation(Operation.payment({ destination: opts.dest ?? owner, asset: opts.asset ?? USDC, amount: opts.amount ?? "5.0000000" }))
    .addMemo(Memo.text(opts.memo ?? link.id)).setTimeout(300).build();
  t.sign(payer); return parseTx(t.toXDR());
}
const show = (name: string, r: ReturnType<typeof checkLinkPayment>) =>
  console.log(name.padEnd(14), r.ok ? "PAID" : "REJECTED", r.checks.filter(c => !c.ok).map(c => c.label).join("; "), r.ok ? `payer ok: ${r.payer === payer.publicKey()}` : "");
show("valid", checkLinkPayment(tx({}), link));
show("fake USDC", checkLinkPayment(tx({ asset: FAKE }), link));
show("XLM", checkLinkPayment(tx({ asset: Asset.native() }), link));
show("wrong wallet", checkLinkPayment(tx({ dest: Keypair.random().publicKey() }), link));
show("short amount", checkLinkPayment(tx({ amount: "4.99" }), link));
show("other link", checkLinkPayment(tx({ memo: "zzzzzzzzzz" }), link));
