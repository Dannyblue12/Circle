import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Add it to your .env file (see "Run it locally" in the README), then restart the app.`);
  return v;
}

export const serverConfig = {
  get twApiKey() {
    return required("TRUSTLESS_WORK_API_KEY");
  },
  twApiUrl: process.env.TRUSTLESS_WORK_API_URL || "https://dev.api.trustlesswork.com",
  get platformPublic() {
    return required("PLATFORM_PUBLIC_KEY");
  },
  get platformSecret() {
    return required("PLATFORM_SECRET_KEY");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT || "1"),
  adminAddresses: (process.env.ADMIN_ADDRESSES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  escrowTrustline:
    process.env.ESCROW_TRUSTLINE_ADDRESS ||
    process.env.NEXT_PUBLIC_USDC_ISSUER ||
    "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

export function isAdmin(address: string | null | undefined) {
  if (!address) return false;
  return serverConfig.adminAddresses.includes(address) || address === process.env.PLATFORM_PUBLIC_KEY;
}
