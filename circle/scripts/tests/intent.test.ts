import { Account, Asset, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { makeIntent, readIntent } from "../../src/lib/intent";
process.env.SESSION_SECRET ||= "test-secret";
const pass = "Test SDF Network ; September 2015";
const kp = Keypair.random();
const build = (amount: string) =>
  new TransactionBuilder(new Account(kp.publicKey(), "1"), { fee: "100", networkPassphrase: pass })
    .addOperation(Operation.payment({ destination: Keypair.random().publicKey(), asset: Asset.native(), amount }))
    .setTimeout(300).build();
const sign = (xdr: string) => { const t = TransactionBuilder.fromXDR(xdr, pass); t.sign(kp); return t.toXDR(); };
const attempt = (fn: () => unknown) => { try { fn(); return "accepted"; } catch (e) { return `rejected: ${(e as Error).message}`; } };

const tx = build("1").toXDR();
const { intent } = makeIntent({ kind: "fund", projectId: "p1", signer: kp.publicKey() }, tx);
console.log("same tx, same wallet:     ", attempt(() => readIntent(intent, sign(tx), kp.publicKey())));
console.log("swapped transaction:      ", attempt(() => readIntent(intent, sign(build("999").toXDR()), kp.publicKey())));
console.log("different signed-in user: ", attempt(() => readIntent(intent, sign(tx), Keypair.random().publicKey())));
console.log("tampered token:           ", attempt(() => readIntent(intent.replace(/^./, "x"), sign(tx), kp.publicKey())));
const pay = makeIntent({ kind: "pay", linkId: "abc", signer: kp.publicKey() }, tx);
console.log("pay link, no sign-in:     ", attempt(() => readIntent(pay.intent, sign(tx), null)));
