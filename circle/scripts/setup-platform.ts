/**
 * Sets up Circle's Platform account on Stellar testnet:
 *  1. creates a keypair (or reuses PLATFORM_SECRET_KEY from .env)
 *  2. funds it with Friendbot (testnet XLM for fees)
 *  3. adds a USDC trustline so it can receive the platform fee
 * and prints the lines to paste into .env.
 *
 *   npm run setup:platform
 */
import { config } from "dotenv";
config();
import { randomBytes } from "crypto";
import { Asset, BASE_FEE, Horizon, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";

const HORIZON = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
const ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

async function main() {
  const kp = process.env.PLATFORM_SECRET_KEY ? Keypair.fromSecret(process.env.PLATFORM_SECRET_KEY) : Keypair.random();
  const server = new Horizon.Server(HORIZON);

  let account = await server.loadAccount(kp.publicKey()).catch(() => null);
  if (!account) {
    console.log("Funding with Friendbot…");
    const r = await fetch(`https://friendbot.stellar.org/?addr=${kp.publicKey()}`);
    if (!r.ok) throw new Error(`Friendbot failed: ${r.status} ${await r.text()}`);
    account = await server.loadAccount(kp.publicKey());
  }

  const hasUsdc = account.balances.some((b) => "asset_code" in b && b.asset_code === "USDC" && b.asset_issuer === ISSUER);
  if (!hasUsdc) {
    console.log("Adding USDC trustline…");
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.changeTrust({ asset: new Asset("USDC", ISSUER) }))
      .setTimeout(60)
      .build();
    tx.sign(kp);
    await server.submitTransaction(tx);
  }

  console.log("\nPlatform account ready. Put these in .env (and in Vercel's environment variables):\n");
  console.log(`PLATFORM_PUBLIC_KEY="${kp.publicKey()}"`);
  console.log(`PLATFORM_SECRET_KEY="${kp.secret()}"`);
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.startsWith("dev-only")) {
    console.log(`SESSION_SECRET="${randomBytes(32).toString("hex")}"`);
  }
  console.log("\nKeep the secret key private. It signs releases and dispute resolutions.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
