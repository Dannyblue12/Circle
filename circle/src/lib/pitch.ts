// The pitch deck shown on the website. Images and the PDF are rendered from
// scripts/pitch/slides.html by scripts/pitch/render.cjs into public/pitch/.
export const PITCH_PDF = "/pitch/circle-pitch-deck.pdf";

export const PITCH_SLIDES = [
  { title: "Get paid safely, even as a team", summary: "Circle: gigs, escrow and team payouts in USDC on Stellar. Stellar’s global talent hub, live on testnet." },
  { title: "The problem", summary: "Freelancers get ghosted after delivery, one wallet holds the whole team’s pay, and fake payment alerts are common." },
  { title: "The solution", summary: "Post, hire and lock USDC in escrow, deliver with proof, approve: each member is paid straight to their own wallet." },
  { title: "The proof", summary: "Multi-release escrow, team splits, on-chain receipts, fair disputes and wallet sign-in, running on Stellar testnet." },
  { title: "Why Stellar, not Solana", summary: "Built for payments, a tiny predictable fee, local cash-out through anchors, and ready-made escrow on Soroban." },
  { title: "The team", summary: "Daniel, Ubongabasi, Bassey and Favour: builders who already lead GDGoC and Notion campus communities." },
  { title: "The ask", summary: "Make Circle Stellar’s global talent hub: backing for mainnet, anchor introductions, and community programmes." },
].map((s, i) => ({ ...s, src: `/pitch/slide-${i + 1}.png`, thumb: `/pitch/thumb-${i + 1}.jpg` }));
