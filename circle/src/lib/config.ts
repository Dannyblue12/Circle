// Values that are safe in the browser (NEXT_PUBLIC_*). Server secrets live in server-config.ts.
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
export const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
export const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER || "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://stellar.expert/explorer/testnet";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const IS_TESTNET = NETWORK_PASSPHRASE.startsWith("Test");

/** Trustless Work protocol fee, fixed at 0.3% and taken on-chain at release. */
export const PROTOCOL_FEE_PERCENT = 0.3;

export const explorer = {
  tx: (hash: string) => `${EXPLORER_URL}/tx/${hash}`,
  account: (address: string) => `${EXPLORER_URL}/account/${address}`,
  contract: (id: string) => `${EXPLORER_URL}/contract/${id}`,
};
