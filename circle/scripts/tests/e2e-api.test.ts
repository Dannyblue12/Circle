/**
 * Exercises the marketplace API end to end against a running server, signing in with
 * throwaway keypairs exactly like a wallet would. On-chain steps need Trustless Work + testnet,
 * so here we only check they fail cleanly when not configured.
 *   BASE=http://localhost:3000 npx tsx scripts/tests/e2e-api.test.ts
 */
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";

const BASE = process.env.BASE || "http://localhost:3000";
const PASS = "Test SDF Network ; September 2015";
let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};

class Session {
  cookies: Record<string, string> = {};
  constructor(public kp: Keypair) {}
  get address() { return this.kp.publicKey(); }
  async req(path: string, body?: unknown, method = body ? "POST" : "GET") {
    const res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", cookie: Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; ") },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const [k, v] = kv.split("=");
      if (v) this.cookies[k] = v; else delete this.cookies[k];
    }
    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = text;
    try { data = JSON.parse(text); } catch {}
    return { status: res.status, data };
  }
  async signIn() {
    const { data } = await this.req("/api/auth/challenge", { address: this.address });
    const tx = TransactionBuilder.fromXDR(data.xdr, PASS);
    tx.sign(this.kp);
    return this.req("/api/auth/verify", { signedXdr: tx.toXDR() });
  }
}

async function main() {
  const client = new Session(Keypair.random());
  const lead = new Session(Keypair.random());
  const member = Keypair.random().publicKey();
  const anon = new Session(Keypair.random());
  const impostor = new Session(Keypair.random());

  // Sign-in
  check("client signs in", (await client.signIn()).status === 200);
  check("lead signs in", (await lead.signIn()).status === 200);
  check("impostor signs in", (await impostor.signIn()).status === 200);
  {
    const s = new Session(Keypair.random());
    const { data } = await s.req("/api/auth/challenge", { address: s.address });
    const tx = TransactionBuilder.fromXDR(data.xdr, PASS);
    tx.sign(Keypair.random()); // wrong key
    const r = await s.req("/api/auth/verify", { signedXdr: tx.toXDR() });
    check("sign-in with the wrong key is rejected", r.status === 401, r.data.error);
  }
  check("/api/me knows the client", (await client.req("/api/me")).data.address === client.address);

  // Profiles
  check("lead saves profile", (await lead.req("/api/profile", { name: "Ada Test", headline: "Designer", bio: "", category: "Design", skills: "Figma", location: "Uyo", link: "" }, "PUT")).status === 200);
  check("bad profile link rejected", (await lead.req("/api/profile", { name: "Ada", link: "javascript:alert(1)" }, "PUT")).status === 400);

  // Gigs
  check("anonymous can't post a gig", (await anon.req("/api/gigs", { title: "x" })).status === 401);
  const gig = await client.req("/api/gigs", { title: "Brand kit for a test bakery", description: "Logo, illustrations and packaging mockups please.", category: "Design", skills: "Figma", budget: 30 });
  check("client posts a gig", gig.status === 200 && !!gig.data.id);
  const gigId = gig.data.id;
  check("invalid gig rejected", (await client.req("/api/gigs", { title: "x", description: "short", category: "Nope", budget: -1 })).status === 400);

  // Apply
  const team = [
    { description: "Logo and design lead", memberName: "Ada", receiver: lead.address, amount: 15 },
    { description: "Illustrations", memberName: "Tunde", receiver: member, amount: 15 },
  ];
  check("client can't apply to own gig", (await client.req(`/api/gigs/${gigId}/apply`, { pitch: "I'd like to do my own gig please", milestones: team })).status === 400);
  check("bad wallet in team rejected", (await lead.req(`/api/gigs/${gigId}/apply`, { pitch: "We are a great team for this job", milestones: [{ ...team[0], receiver: "GBAD" }] })).status === 400);
  check("lead applies as a team", (await lead.req(`/api/gigs/${gigId}/apply`, { pitch: "We are a great team for this job", milestones: team })).status === 200);
  check("lead updates application", (await lead.req(`/api/gigs/${gigId}/apply`, { pitch: "We are a great team for this job (updated)", milestones: team })).status === 200);
  const imp = await impostor.req(`/api/gigs/${gigId}/apply`, { pitch: "Pick me instead, I'm cheaper", milestones: [{ description: "All", memberName: "Imp", receiver: impostor.address, amount: 10 }] });
  check("second freelancer applies", imp.status === 200);

  // Gig page shows applications to the owner only
  const asOwner = await client.req(`/gigs/${gigId}`);
  const asOther = await impostor.req(`/gigs/${gigId}`);
  check("owner sees applications", typeof asOwner.data === "string" && asOwner.data.includes("We are a great team for this job (updated)"));
  check("others don't see applications", typeof asOther.data === "string" && !asOther.data.includes("We are a great team"));

  // Hire — need the application id; read it from the owner's HTML is brittle, so hire via the lead's app id lookup
  // Each application card has id="app-<id>"; pick the one containing the lead's pitch.
  const cards = asOwner.data.split('id="app-').slice(1);
  const leadCard = cards.find((c: string) => c.includes("We are a great team for this job (updated)"));
  const appIdMatch = leadCard ? /^([a-z0-9]+)"/.exec(leadCard) : null;
  const appId = appIdMatch?.[1];
  check("found application id in page", !!appId);
  check("non-owner can't hire", (await impostor.req(`/api/gigs/${gigId}/hire`, { applicationId: appId })).status === 403);
  const hire = await client.req(`/api/gigs/${gigId}/hire`, { applicationId: appId });
  check("client hires the team", hire.status === 200 && !!hire.data.projectId, JSON.stringify(hire.data));
  const projectId = hire.data.projectId;
  const projPage = await lead.req(`/p/${projectId}`);
  check("the lead's team was hired", /lead (<!-- -->)?Ada Test/.test(projPage.data));
  check("can't hire twice", (await client.req(`/api/gigs/${gigId}/hire`, { applicationId: appId })).status === 409);
  check("can't apply after hire", (await impostor.req(`/api/gigs/${gigId}/apply`, { pitch: "Too late but trying anyway", milestones: team })).status === 409);

  const page = await client.req(`/p/${projectId}`);
  check("project page renders", page.status === 200 && page.data.includes("Brand kit for a test bakery"));

  // Escrow actions: role checks happen before any network call
  const impDeploy = await impostor.req(`/api/projects/${projectId}/prepare`, { action: "deploy" });
  check("impostor can't deploy escrow", impDeploy.status === 403, `${impDeploy.status} ${JSON.stringify(impDeploy.data).slice(0, 120)}`);
  check("can't fund before deploy", (await client.req(`/api/projects/${projectId}/prepare`, { action: "fund" })).status === 409);
  const deploy = await client.req(`/api/projects/${projectId}/prepare`, { action: "deploy" });
  check("deploy fails cleanly without Trustless Work config", deploy.status >= 400 && typeof deploy.data.error === "string", deploy.data.error);
  check("forged intent rejected", (await client.req(`/api/escrow/submit`, { intent: "eyJmYWtlIjoxfQ.bad", signedXdr: "AAAAAgAAAAA" })).status === 400);

  // Direct project
  const direct = await lead.req("/api/projects", { title: "Logo refresh · Ekpe Stores", clientAddress: client.address, milestones: team });
  check("lead creates a direct project", direct.status === 200 && !!direct.data.id);
  check("client can't be a team member", (await lead.req("/api/projects", { title: "Bad one", clientAddress: client.address, milestones: [{ ...team[0], receiver: client.address }] })).status === 400);

  // Pay links
  const link = await lead.req("/api/links", { amount: 5, description: "Flyer design" });
  check("lead creates a pay link", link.status === 200 && link.data.id.length === 10);
  const payPage = await anon.req(`/pay/${link.data.id}`);
  check("pay page renders", payPage.status === 200 && payPage.data.includes("Flyer design"));
  check("owner can't pay own link", (await lead.req(`/api/links/${link.data.id}/prepare`, { payer: lead.address })).status === 400);
  check("bad tx hash rejected", (await anon.req(`/api/links/${link.data.id}/verify`, { txHash: "nope" })).status === 400);

  // Dashboard + admin
  const dash = await lead.req("/dashboard");
  check("dashboard lists projects and links", dash.data.includes("Logo refresh · Ekpe Stores") && dash.data.includes("Flyer design"));
  check("non-admin can't resolve", (await lead.req("/api/admin/resolve", { projectId, idx: 0, toReceiverPct: 50 })).status === 403);

  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  console.log(`PROJECT=${projectId} LINK=${link.data.id} GIG=${gigId} CLIENT_COOKIE=${client.cookies.circle_session} LEAD_COOKIE=${lead.cookies.circle_session}`);
  process.exit(failures ? 1 : 0);
}
main();
