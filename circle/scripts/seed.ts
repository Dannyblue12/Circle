/**
 * Sample marketplace data so the app doesn't look empty in a demo:
 * profiles across many careers, open gigs and a few applications.
 * Sample people use fresh random testnet addresses (unfunded), so nobody can sign as them.
 * No fake payments or transactions are created: "paid work" only ever comes from real escrows.
 *
 *   npm run seed            (skips if gigs already exist)
 *   npm run seed -- --force (adds them anyway)
 */
import { config } from "dotenv";
config();
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { Keypair } from "@stellar/stellar-sdk";
import { randomBytes } from "crypto";
import * as schema from "../src/lib/db/schema";

const db = drizzle(createClient({ url: process.env.DATABASE_URL || "file:./dev.db", authToken: process.env.DATABASE_AUTH_TOKEN || undefined }), { schema });
const id = (n = 8) => randomBytes(n).toString("base64url").replace(/[-_]/g, "x").slice(0, n).toLowerCase();
const addr = () => Keypair.random().publicKey();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
const inDays = (d: number) => new Date(Date.now() + d * 86400000);

const people = [
  { key: "ada", name: "Ada Okon", headline: "Brand designer · logos, packaging, social kits", category: "Design", skills: "Figma, Illustrator, Branding, Packaging", location: "Uyo, Nigeria", bio: "I lead a small design crew in Uyo. We do brand kits for food businesses and shops, usually in under two weeks." },
  { key: "tunde", name: "Tunde Bakare", headline: "Illustrator · characters and spot art", category: "Design", skills: "Procreate, Illustration, Character design", location: "Lagos, Nigeria", bio: "Hand-drawn illustrations for packaging, books and social posts." },
  { key: "ifeoma", name: "Ifeoma Eze", headline: "3D and packaging mockups", category: "Design", skills: "Blender, Mockups, Packaging", location: "Enugu, Nigeria", bio: "" },
  { key: "emem", name: "Emem Udoh", headline: "Full-stack developer · Next.js, React Native", category: "Development", skills: "Next.js, React Native, Node, Postgres", location: "Uyo, Nigeria", bio: "Shipping web and mobile apps for startups and schools." },
  { key: "zainab", name: "Zainab Musa", headline: "Copywriter and content strategist", category: "Writing & Content", skills: "Copywriting, Blog posts, SEO, Scripts", location: "Abuja, Nigeria", bio: "Words that sell, for brands across Africa." },
  { key: "kelechi", name: "Kelechi Nwosu", headline: "Video editor · Reels, YouTube, ads", category: "Video & Animation", skills: "Premiere Pro, After Effects, CapCut", location: "Port Harcourt, Nigeria", bio: "" },
  { key: "aniekan", name: "Aniekan Etim", headline: "Social media manager", category: "Marketing & Social", skills: "Instagram, TikTok, Content calendar, Ads", location: "Uyo, Nigeria", bio: "" },
  { key: "bisi", name: "Bisi Adeyemi", headline: "Yoruba ⇄ English translator", category: "Translation", skills: "Yoruba, English, Subtitles", location: "Ibadan, Nigeria", bio: "" },
  { key: "chidi", name: "Chidi Obi", headline: "Maths and physics tutor (WAEC, JAMB)", category: "Teaching & Tutoring", skills: "Maths, Physics, JAMB prep", location: "Owerri, Nigeria", bio: "" },
  { key: "amaka", name: "Amaka Ibe", headline: "Music producer and mixing engineer", category: "Music & Audio", skills: "Mixing, Mastering, Jingles, Voice-over", location: "Lagos, Nigeria", bio: "" },
  { key: "uyoBakery", name: "Uyo Bakery", headline: "Bakery and cafe", category: "", skills: "", location: "Uyo, Nigeria", bio: "" },
  { key: "ekpe", name: "Ekpe Stores", headline: "Retail shop", category: "", skills: "", location: "Calabar, Nigeria", bio: "" },
  { key: "learnly", name: "Learnly Academy", headline: "Online school", category: "", skills: "", location: "Abuja, Nigeria", bio: "" },
  { key: "nova", name: "Nova Labs", headline: "Web3 startup", category: "", skills: "", location: "Remote", bio: "" },
] as const;

type Key = (typeof people)[number]["key"];

async function main() {
  const existing = await db.select({ id: schema.gigs.id }).from(schema.gigs).limit(1);
  if (existing.length && !process.argv.includes("--force")) {
    console.log("Sample data skipped: the database already has gigs. Use `npm run seed -- --force` to add it anyway.");
    return;
  }
  const a = {} as Record<Key, string>;
  for (const p of people) a[p.key] = addr();
  await db.insert(schema.users).values(
    people.map((p, i) => ({ address: a[p.key], name: p.name, headline: p.headline, category: p.category, skills: p.skills, location: p.location, bio: p.bio, link: "", createdAt: daysAgo(30 - i) })),
  );

  const gigs = [
    { client: "uyoBakery", title: "Brand kit for a bakery in Uyo", category: "Design", budget: 30, skills: "Logo, Branding, Packaging", days: 1, due: 14, description: "We're refreshing our look. Need a new logo, 6 illustrations of our pastries for social media, and packaging mockups for cake boxes. Teams welcome: we'd like one person leading." },
    { client: "learnly", title: "Landing page for an online school (Next.js)", category: "Development", budget: 120, skills: "Next.js, Tailwind, SEO", days: 2, due: 21, description: "Build a fast, mobile-first landing page with a course list, pricing and a sign-up form that posts to our API. Design is ready in Figma." },
    { client: "nova", title: "5 blog posts explaining stablecoin payments", category: "Writing & Content", budget: 50, skills: "Copywriting, Crypto, SEO", days: 3, due: 10, description: "Plain-English posts (800–1,000 words each) for freelancers who are new to USDC. Topics provided. Must be original." },
    { client: "ekpe", title: "Edit 10 Instagram Reels from raw footage", category: "Video & Animation", budget: 25, skills: "CapCut, Reels, Captions", days: 4, due: 7, description: "We have raw phone videos of our products. Need 10 short Reels with captions, music and our logo at the end." },
    { client: "uyoBakery", title: "Manage our Instagram and TikTok for one month", category: "Marketing & Social", budget: 60, skills: "Instagram, TikTok, Content calendar", days: 5, due: 30, description: "Plan and post 3 times a week, reply to comments, and send a short report at the end of the month." },
    { client: "learnly", title: "Translate course videos to Yoruba subtitles", category: "Translation", budget: 40, skills: "Yoruba, Subtitles", days: 6, due: 12, description: "6 videos, about 15 minutes each. Deliver .srt files. Accuracy matters more than speed." },
    { client: "learnly", title: "JAMB physics tutor for 8 weekend classes", category: "Teaching & Tutoring", budget: 45, skills: "Physics, JAMB prep", days: 7, due: 30, description: "Live online classes for a group of 12 students, Saturdays and Sundays. Share your lesson plan when you apply." },
    { client: "nova", title: "30-second radio jingle with voice-over", category: "Music & Audio", budget: 35, skills: "Jingles, Voice-over, Mixing", days: 8, due: 9, description: "Upbeat jingle for our app launch, English with a little Pidgin. Deliver WAV + MP3." },
    { client: "ekpe", title: "Product photos for 40 items, white background", category: "Photography", budget: 30, skills: "Product photography, Editing", days: 9, due: 10, description: "Shoot in our store in Calabar or we send items to you. Clean white background, edited and sized for an online shop." },
    { client: "nova", title: "Research: 50 freelance communities in West Africa", category: "Data & Research", budget: 20, skills: "Research, Spreadsheets", days: 10, due: 5, description: "A spreadsheet with name, platform, size, focus and contact link for 50 active freelancer communities." },
  ] as const;

  const gigIds: Record<string, string> = {};
  for (const g of gigs) {
    const gid = id();
    gigIds[g.title] = gid;
    await db.insert(schema.gigs).values({
      id: gid,
      clientAddress: a[g.client],
      title: g.title,
      description: g.description,
      category: g.category,
      skills: g.skills,
      budget: g.budget,
      deadline: inDays(g.due),
      createdAt: daysAgo(g.days),
    });
  }

  await db.insert(schema.applications).values([
    {
      id: id(),
      gigId: gigIds["Brand kit for a bakery in Uyo"],
      leadAddress: a.ada,
      pitch: "We're a three-person crew in Uyo: I lead and do the logo, Tunde draws the illustrations, Ifeoma does packaging mockups. We did a similar kit for a cafe last month and can deliver in 10 days.",
      link: "",
      milestones: [
        { description: "Logo and design lead", memberName: "Ada", receiver: a.ada, amount: 15 },
        { description: "Illustrations", memberName: "Tunde", receiver: a.tunde, amount: 10 },
        { description: "Packaging mockups", memberName: "Ifeoma", receiver: a.ifeoma, amount: 5 },
      ],
      total: 30,
      createdAt: daysAgo(0.5),
    },
    {
      id: id(),
      gigId: gigIds["Landing page for an online school (Next.js)"],
      leadAddress: a.emem,
      pitch: "I build Next.js sites every week. I'll match your Figma pixel for pixel, hit 95+ on Lighthouse, and wire the form to your API.",
      link: "",
      milestones: [
        { description: "Pages built from Figma", memberName: "Emem", receiver: a.emem, amount: 80 },
        { description: "Form + API + launch", memberName: "Emem", receiver: a.emem, amount: 40 },
      ],
      total: 120,
      createdAt: daysAgo(1),
    },
    {
      id: id(),
      gigId: gigIds["5 blog posts explaining stablecoin payments"],
      leadAddress: a.zainab,
      pitch: "I write for fintech brands and explain money topics simply. Happy to send an outline for all five posts first.",
      link: "",
      milestones: [{ description: "Five posts", memberName: "Zainab", receiver: a.zainab, amount: 50 }],
      total: 50,
      createdAt: daysAgo(2),
    },
  ]);

  console.log(`Seeded ${people.length} profiles, ${gigs.length} gigs and 3 applications.`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
