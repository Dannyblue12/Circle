# Circle

A gig marketplace where freelancers and small teams get paid in USDC on Stellar.

Clients post gigs in any field (design, code, writing, video, translation, tutoring…). Freelancers apply solo or as a team with a split. When the client hires, their USDC is locked in a Trustless Work escrow before work starts, and every team member is paid straight to their own wallet as each milestone is approved. For small jobs there are quick pay links with on-chain verified receipts.

Built for Boundless Build Day (Stellar testnet).

---

## What's in it

| Area | What it does |
|---|---|
| **Marketplace** | Instant search, category counts, budget filters and sorting; save gigs for later; share a gig in one tap. Post a gig from a template with a live preview, apply solo or as a team with a visual split, hire one application. Talent directory and public profiles with earnings verified on-chain. |
| **Landing site + pitch** | The home page tells the story (problem, how it works, a live split calculator, why Stellar, the team) and carries the pitch deck as a carousel: swipe, arrow keys, autoplay, full screen, and downloads (PDF or one slide as PNG). `/pitch` is a page to send to judges. |
| **Demo gigs** | 27 sample gigs across every category, with sample profiles and applications (solo and team), added automatically on an empty database. They're tagged "Sample" in the app and can be removed in one command. |
| **Escrow + team split** | Hiring turns the winning application into a multi-release escrow: one milestone per person, each with its own wallet. Client funds, lead marks done with proof, client approves, the Platform account releases that share automatically. |
| **Direct projects** | For clients found on WhatsApp/X: the lead creates a project with a client wallet and sends a `/p/…` link. |
| **Disputes** | Client or lead can dispute a milestone; its money freezes. An admin splits it (e.g. 70/30) and the contract pays both in one transaction. |
| **Quick pay links** | Fixed recipient, asset, amount and memo. A payment only counts after the backend checks it on Stellar: succeeded, real USDC, right wallet, exact amount, made for this link, not reused. |
| **Wallet sign-in** | Connect with Varial (formerly Freighter) or any wallet in Stellar Wallets Kit. Sign-in is a SEP-10-style signature on a transaction that can never be submitted. |

## Who signs what

| Step | Signed by | Where |
|---|---|---|
| Sign in | User's wallet | Browser |
| Create escrow | Client or team lead | Browser |
| Lock funds | Client | Browser |
| Mark milestone done + proof | Team lead (service provider) | Browser |
| Approve milestone | Client (approver) | Browser |
| Release that person's share | Platform account | Server, automatic after approval |
| Raise dispute | Client or team lead | Browser |
| Resolve dispute | Platform account (dispute resolver) | Server, from `/admin` |
| Pay a quick pay link | Payer's wallet | Browser |

The Trustless Work API key and the Platform secret key never reach the browser.

---

## Run it locally

You need Node 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

The first `npm run dev` sets itself up: it creates `.env` from `.env.example` (with a random `SESSION_SECRET`), creates the database tables in `dev.db`, and adds the demo gigs if the database has no gigs yet. This runs again before every `dev`, `build` and `start`, and it's safe to repeat. You can also run it on its own with `npm run setup`.

### Demo gigs

The demo data is 27 open gigs (every category, budgets from 15 to 300 USDC, some closing soon), 27 sample profiles, and 25 applications, some of them team splits. It's added automatically when the database has no gigs, including on a fresh Vercel + Turso deploy.

- Sample people get fresh random testnet addresses that nobody holds, so nobody can sign in as them, and no payments or projects are faked. You can practise applying to a sample gig, but its client will never hire.
- Every demo row is flagged in the database and tagged **Sample** in the app.
- Their dates are moved forward on each start, so an old demo never looks abandoned. Your own gigs are never touched.

```bash
npm run seed -- --reset    # fresh set of demo data
npm run seed -- --remove   # delete it (your real gigs and profiles stay), and stop re-adding it
```

To start with an empty marketplace, set `DEMO_DATA="false"` before the first start (on Vercel, as an environment variable).

The marketplace (profiles, gigs, applications, hiring, pay link pages) works straight away. For the on-chain parts, fill in `.env` and restart:

1. **Trustless Work API key.** Request a testnet key in the Trustless Work dApp and set `TRUSTLESS_WORK_API_KEY`.
2. **Platform account.** Run `npm run setup:platform`. It creates a testnet keypair, funds it with Friendbot, adds a USDC trustline, and prints `PLATFORM_PUBLIC_KEY` and `PLATFORM_SECRET_KEY` to paste into `.env`.
3. **Admins.** Put the wallet you'll resolve disputes with in `ADMIN_ADDRESSES`.

### Testnet wallets for the demo

You need three browser profiles (or wallets): **client**, **team lead**, **team member**.

For each one:
1. Install Varial, create a wallet, switch the network to **Testnet**.
2. Fund it with XLM from Friendbot (Varial offers this on testnet).
3. Add a **USDC trustline**, issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.
4. Get test USDC from the Circle faucet (faucet.circle.com, choose Stellar). The client needs enough to fund the escrow.

Every member who will be paid needs the USDC trustline, or their release fails. The project page warns you before funding if someone is missing it.

### 5-minute demo script

1. **Client** connects, posts "Brand kit · Uyo Bakery" for 30 USDC.
2. **Lead** connects, fills in their profile, applies as a team: Ada 15, Tunde 10, Ifeoma 5 (each with their own wallet).
3. **Client** opens the gig, sees the application and the split, taps **Hire**.
4. **Client** taps **Create escrow** (sign) then **Lock 30 USDC** (sign). Show the contract on the explorer.
5. **Lead** marks Tunde's milestone done with a Figma link (sign).
6. **Client** taps **Approve and pay Tunde** (sign). The share is released automatically. Show the transaction.
7. Optional: client disputes Ifeoma's milestone; admin resolves 70/30 from `/admin`.
8. **Quick pay link**: lead creates a 5 USDC link, client pays it, the receipt lists what was checked on-chain.

---

## Deploy to Vercel

SQLite files don't persist on Vercel, so use a free **Turso** database (libSQL). The code is the same; only the URL changes.

1. Create a Turso database and a token, then set:
   ```
   DATABASE_URL="libsql://<your-db>.turso.io"
   DATABASE_AUTH_TOKEN="<token>"
   ```
2. Import the repo in Vercel and add every variable from `.env` (including `NEXT_PUBLIC_APP_URL` set to your Vercel URL).
3. Deploy. The build creates the tables in Turso automatically.

---

## Project map

```
src/
  app/
    page.tsx                 Landing page
    gigs/                    Browse, post (new), detail + apply + hire ([id])
    talent/, u/[address]/    Talent directory and public profiles
    profile/                 Edit your profile
    dashboard/               Balance, projects, gigs, applications, pay links
    projects/new/            Direct project for an off-platform client
    p/[id]/                  Project tracker (create, fund, deliver, approve, dispute, paid)
    links/new/, pay/[id]/    Quick pay links and verified receipts
    admin/                   Dispute resolution
    api/                     Route handlers (see below)
  components/                UI, wallet provider, forms, project tracker
  lib/
    trustless.ts             Server-side Trustless Work client (multi-release escrow)
    escrow.ts                Prepare/submit escrow actions, auto-release, resolve disputes
    stellar-server.ts        Platform signing, payment verification, balances
    intent.ts                Binds each unsigned transaction to the action it performs
    auth-challenge.ts        Wallet sign-in
    db/schema.ts             Drizzle schema (users, gigs, applications, projects, milestones, pay links)
drizzle/                     SQL migrations, applied automatically by scripts/setup.ts
scripts/
  setup.ts                   Creates .env and the database tables (runs before dev/build/start)
  demo.ts                    Demo gigs, profiles and applications (add, remove, keep dates current)
  seed.ts, setup-platform.ts
  tests/                     Offline unit tests and an API end-to-end test
```

API routes: `auth/{challenge,verify,logout}`, `me`, `profile`, `gigs`, `gigs/[id]/{apply,hire,close}`, `projects`, `projects/[id]/{prepare,release}`, `escrow/submit`, `admin/resolve`, `links`, `links/[id]/{prepare,submit,verify}`.

## How the safety checks work

- **Two-step writes.** For every escrow action the server asks Trustless Work for the unsigned transaction and returns it with a signed *intent* (what the action is, and the transaction hash). On submit, the signed transaction must hash to the same value, so nobody can swap in a different transaction and have the app record the wrong thing.
- **Release only on-chain truth.** Before the Platform account releases a share, the server reads the escrow from Trustless Work (`validateOnChain`) and requires that milestone to be approved, not released and not disputed. The database is never trusted for money movement.
- **Receipts.** Quick pay links are marked paid only after the transaction is confirmed on Stellar and passes every check; each hash can be used once.
- **What lives where.** On Stellar: the escrow, the USDC, the roles, every payment. In the database: titles, names, profiles, link ids, statuses. No emails or phone numbers are collected.

## Pitch deck

The slides live in `scripts/pitch/slides.html` (plain HTML, one 1920×1080 `<section>` per slide). After editing it, re-render the images and PDF in `public/pitch/` with:

```bash
node scripts/pitch/render.cjs   # needs Playwright with Chromium
```

Slide titles and summaries for the carousel are in `src/lib/pitch.ts`.

## Tests

```bash
npm test          # offline: sign-in, payment checks, intent binding
npm run dev       # then, in another terminal:
npm run test:api  # marketplace API end to end with throwaway wallets (expects the app on localhost:3000)
```

Changed `src/lib/db/schema.ts`? Run `npm run db:generate` to add a migration; it's applied on the next start.

## Before demo day: check on testnet

These parts were written against the Trustless Work docs and SDK (v3, `dev.api.trustlesswork.com`) but could not be run against the live API from the build environment. Do one full dry run:

- **Deploy** returns a `contractId` after sending. If it doesn't, the app falls back to reading it from the transaction result.
- **Trustline**: the escrow uses the USDC issuer address. If deploy complains about the trustline, set `ESCROW_TRUSTLINE_ADDRESS` to the USDC contract id `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`.
- **Fees**: the screens show amounts after the Circle fee (`PLATFORM_FEE_PERCENT`) and the 0.3% protocol fee. Confirm against the release transactions.
- If Trustless Work moves you to its v2 API (`beta.api.trustlesswork.com`), only `src/lib/trustless.ts` needs to change.

## Next steps

Notifications (email/WhatsApp) when you're hired or a milestone needs approval, in-app messages, ratings after payout, bounties (prize locked when posted, paid to chosen winners), and mainnet after an audit.
