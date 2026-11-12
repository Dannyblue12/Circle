/**
 * Demo marketplace data: sample profiles, open gigs in every category, and applications
 * (solo and team splits), so the app never looks empty in a demo.
 *
 * - Sample people get fresh random testnet addresses (unfunded), so nobody can sign as them.
 * - Every row is flagged `demo`, so the UI can tag it as a sample and it can be removed cleanly.
 * - No payments, projects or transactions are created: "paid work" only ever comes from real escrows.
 *
 * Used by scripts/seed.ts (manual) and scripts/setup.ts (automatic on an empty database).
 */
import { Keypair } from "@stellar/stellar-sdk";
import { randomBytes } from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/schema";

type DB = LibSQLDatabase<typeof schema>;

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const id = (n = 8) => randomBytes(n).toString("base64url").replace(/[-_]/g, "x").slice(0, n).toLowerCase();

const people = [
  // Freelancers
  { key: "ada", name: "Ada Okon", headline: "Brand designer · logos, packaging, social kits", category: "Design", skills: "Figma, Illustrator, Branding, Packaging", location: "Uyo, Nigeria", bio: "I lead a small design crew in Uyo. We do brand kits for food businesses and shops, usually in under two weeks." },
  { key: "tunde", name: "Tunde Bakare", headline: "Illustrator · characters and spot art", category: "Design", skills: "Procreate, Illustration, Character design", location: "Lagos, Nigeria", bio: "Hand-drawn illustrations for packaging, books and social posts." },
  { key: "ifeoma", name: "Ifeoma Eze", headline: "3D and packaging mockups", category: "Design", skills: "Blender, Mockups, Packaging", location: "Enugu, Nigeria", bio: "Photoreal 3D mockups so clients can see the box before it's printed." },
  { key: "kwame", name: "Kwame Mensah", headline: "Product designer · mobile and web apps", category: "Design", skills: "Figma, UI design, UX research, Prototyping", location: "Accra, Ghana", bio: "Five years designing fintech and edtech apps. I test with real users before handing off." },
  { key: "emem", name: "Emem Udoh", headline: "Full-stack developer · Next.js, React Native", category: "Development", skills: "Next.js, React Native, Node, Postgres", location: "Uyo, Nigeria", bio: "Shipping web and mobile apps for startups and schools." },
  { key: "efe", name: "Efe Ogbe", headline: "Backend and bots · Node, WhatsApp API, Soroban", category: "Development", skills: "Node, TypeScript, WhatsApp API, Rust, Soroban", location: "Benin City, Nigeria", bio: "I build the boring, reliable parts: APIs, bots, payments and smart contracts." },
  { key: "zainab", name: "Zainab Musa", headline: "Copywriter and content strategist", category: "Writing & Content", skills: "Copywriting, Blog posts, SEO, Scripts", location: "Abuja, Nigeria", bio: "Words that sell, for brands across Africa." },
  { key: "grace", name: "Grace Wanjiru", headline: "Grant writer and technical writer", category: "Writing & Content", skills: "Grant writing, Technical writing, Editing, Research", location: "Nairobi, Kenya", bio: "I've helped NGOs win over $400k in grants. Clear writing, on time." },
  { key: "kelechi", name: "Kelechi Nwosu", headline: "Video editor · Reels, YouTube, ads", category: "Video & Animation", skills: "Premiere Pro, After Effects, CapCut", location: "Port Harcourt, Nigeria", bio: "Fast-paced edits that keep people watching to the end." },
  { key: "tobi", name: "Tobi Adeleke", headline: "2D motion designer · explainers and logo animations", category: "Video & Animation", skills: "After Effects, 2D animation, Storyboard, Lottie", location: "Lagos, Nigeria", bio: "" },
  { key: "aniekan", name: "Aniekan Etim", headline: "Social media manager", category: "Marketing & Social", skills: "Instagram, TikTok, Content calendar, Ads", location: "Uyo, Nigeria", bio: "I grew three Uyo food brands past 10k followers in a year." },
  { key: "amaka", name: "Amaka Ibe", headline: "Music producer and mixing engineer", category: "Music & Audio", skills: "Mixing, Mastering, Jingles, Voice-over", location: "Lagos, Nigeria", bio: "Afrobeats, highlife and gospel. Jingles for radio and TikTok." },
  { key: "femi", name: "Femi Alabi", headline: "Product and food photographer", category: "Photography", skills: "Product photography, Food photography, Lighting, Lightroom", location: "Calabar, Nigeria", bio: "Studio in Calabar, travel kit for on-site shoots." },
  { key: "bisi", name: "Bisi Adeyemi", headline: "Yoruba ⇄ English translator", category: "Translation", skills: "Yoruba, English, Subtitles", location: "Ibadan, Nigeria", bio: "" },
  { key: "hauwa", name: "Hauwa Bello", headline: "Hausa, Igbo and English medical translator", category: "Translation", skills: "Hausa, Igbo, Medical translation, Proofreading", location: "Kano, Nigeria", bio: "Former nurse. I translate health material so patients actually understand it." },
  { key: "yusuf", name: "Yusuf Danjuma", headline: "Data analyst · Excel, Python, dashboards", category: "Data & Research", skills: "Excel, Python, Data cleaning, Power BI, Research", location: "Kaduna, Nigeria", bio: "Messy spreadsheets in, clear charts out." },
  { key: "chidi", name: "Chidi Obi", headline: "Maths and physics tutor (WAEC, JAMB)", category: "Teaching & Tutoring", skills: "Maths, Physics, JAMB prep, Excel training", location: "Owerri, Nigeria", bio: "" },
  { key: "ngozi", name: "Ngozi Umeh", headline: "Virtual assistant · inbox, scheduling, data entry", category: "Virtual Assistance", skills: "Google Workspace, Scheduling, Customer support, Shopify, Data entry", location: "Asaba, Nigeria", bio: "Organised, quick to reply, and good with customers." },
  // Clients
  { key: "uyoBakery", name: "Uyo Bakery", headline: "Bakery and cafe", category: "", skills: "", location: "Uyo, Nigeria", bio: "" },
  { key: "ekpe", name: "Ekpe Stores", headline: "Retail shop", category: "", skills: "", location: "Calabar, Nigeria", bio: "" },
  { key: "learnly", name: "Learnly Academy", headline: "Online school", category: "", skills: "", location: "Abuja, Nigeria", bio: "" },
  { key: "nova", name: "Nova Labs", headline: "Web3 startup", category: "", skills: "", location: "Remote", bio: "" },
  { key: "mamaPut", name: "Mama Put Kitchen", headline: "Restaurant and delivery", category: "", skills: "", location: "Lagos, Nigeria", bio: "" },
  { key: "sunrise", name: "Sunrise Clinic", headline: "Community health clinic", category: "", skills: "", location: "Port Harcourt, Nigeria", bio: "" },
  { key: "afroWave", name: "AfroWave Records", headline: "Independent music label", category: "", skills: "", location: "Lagos, Nigeria", bio: "" },
  { key: "kora", name: "Kora Pay", headline: "Fintech startup", category: "", skills: "", location: "Accra, Ghana", bio: "" },
  { key: "greenRoots", name: "GreenRoots", headline: "Clean-water nonprofit", category: "", skills: "", location: "Nairobi, Kenya", bio: "" },
] as const;

type Key = (typeof people)[number]["key"];

type DemoGig = {
  client: Key;
  title: string;
  category: (typeof schema.gigs.$inferInsert)["category"];
  budget: number;
  skills: string;
  /** Hours since it was posted. */
  posted: number;
  /** Days until the deadline. */
  due: number;
  description: string;
};

const gigs: DemoGig[] = [
  // Design
  { client: "uyoBakery", title: "Brand kit for a bakery in Uyo", category: "Design", budget: 30, skills: "Logo, Branding, Packaging", posted: 20, due: 14, description: "We're refreshing our look. Need a new logo, 6 illustrations of our pastries for social media, and packaging mockups for cake boxes.\n\nTeams welcome: we'd like one person leading." },
  { client: "kora", title: "Mobile app UI for a savings wallet (Figma)", category: "Design", budget: 180, skills: "Figma, UI design, Mobile, Prototyping", posted: 5, due: 18, description: "Design 12 screens for our savings app: onboarding, home, save goal, send, receive and settings. We have a logo and colours, nothing else.\n\nDeliver a clickable Figma prototype and a small component library." },
  { client: "afroWave", title: "Concert poster and Instagram carousel", category: "Design", budget: 15, skills: "Poster design, Instagram, Typography", posted: 30, due: 3, description: "One A3 poster and a 5-slide Instagram carousel for a live show next week. Artist photos and copy provided. Bold, colourful, readable on a phone." },
  // Development
  { client: "learnly", title: "Landing page for an online school (Next.js)", category: "Development", budget: 120, skills: "Next.js, Tailwind, SEO", posted: 44, due: 21, description: "Build a fast, mobile-first landing page with a course list, pricing and a sign-up form that posts to our API. Design is ready in Figma." },
  { client: "ekpe", title: "Fix checkout bugs in our WooCommerce store", category: "Development", budget: 40, skills: "WordPress, WooCommerce, PHP", posted: 3, due: 4, description: "Some customers can't finish checkout on mobile, and the delivery fee doesn't update when they change city. Find and fix both, then show us it works on a phone." },
  { client: "mamaPut", title: "WhatsApp ordering bot for a restaurant", category: "Development", budget: 150, skills: "Node, WhatsApp API, Bots", posted: 52, due: 20, description: "Customers should see today's menu, pick dishes, choose pickup or delivery and get an order number, all in WhatsApp. Orders go to a simple page our kitchen can see." },
  { client: "nova", title: "Review a small Soroban vesting contract", category: "Development", budget: 300, skills: "Rust, Soroban, Security", posted: 70, due: 25, description: "About 400 lines of Rust. We want a written review: bugs, risky patterns and missing tests, with suggested fixes. Prior Soroban experience required." },
  // Writing & Content
  { client: "nova", title: "5 blog posts explaining stablecoin payments", category: "Writing & Content", budget: 50, skills: "Copywriting, Crypto, SEO", posted: 72, due: 10, description: "Plain-English posts (800–1,000 words each) for freelancers who are new to USDC. Topics provided. Must be original." },
  { client: "greenRoots", title: "Grant proposal for a clean-water project", category: "Writing & Content", budget: 70, skills: "Grant writing, Research, Editing", posted: 9, due: 9, description: "We're applying for a 25,000 USD grant to build 4 boreholes. We have the budget and data; we need a strong 6-page proposal written to the funder's template." },
  { client: "ekpe", title: "Product descriptions for 60 items", category: "Writing & Content", budget: 20, skills: "Copywriting, E-commerce", posted: 100, due: 6, description: "Short, friendly descriptions (40–60 words) for kitchenware and home items. We send a spreadsheet with names and photos." },
  // Video & Animation
  { client: "ekpe", title: "Edit 10 Instagram Reels from raw footage", category: "Video & Animation", budget: 25, skills: "CapCut, Reels, Captions", posted: 96, due: 7, description: "We have raw phone videos of our products. Need 10 short Reels with captions, music and our logo at the end." },
  { client: "kora", title: "60-second animated explainer for a payments app", category: "Video & Animation", budget: 220, skills: "After Effects, 2D animation, Storyboard, Voice-over", posted: 26, due: 21, description: "Explain how Kora Pay works in one minute: script, storyboard, 2D animation and a warm voice-over. Teams welcome (animator + voice)." },
  // Marketing & Social
  { client: "uyoBakery", title: "Manage our Instagram and TikTok for one month", category: "Marketing & Social", budget: 60, skills: "Instagram, TikTok, Content calendar", posted: 120, due: 30, description: "Plan and post 3 times a week, reply to comments, and send a short report at the end of the month." },
  { client: "afroWave", title: "TikTok launch campaign for a new Afrobeats single", category: "Marketing & Social", budget: 90, skills: "TikTok, Influencers, Campaigns", posted: 14, due: 14, description: "Plan a two-week campaign: a dance challenge, 10 creator partnerships and daily posts. Share past campaign results when you apply." },
  // Music & Audio
  { client: "nova", title: "30-second radio jingle with voice-over", category: "Music & Audio", budget: 35, skills: "Jingles, Voice-over, Mixing", posted: 150, due: 9, description: "Upbeat jingle for our app launch, English with a little Pidgin. Deliver WAV + MP3." },
  { client: "afroWave", title: "Mix and master a 4-track EP", category: "Music & Audio", budget: 110, skills: "Mixing, Mastering, Afrobeats", posted: 60, due: 16, description: "Stems are ready. We want a warm, loud master that holds up on phone speakers and in clubs. Two rounds of revisions included." },
  // Photography
  { client: "ekpe", title: "Product photos for 40 items, white background", category: "Photography", budget: 30, skills: "Product photography, Editing", posted: 170, due: 10, description: "Shoot in our store in Calabar or we send items to you. Clean white background, edited and sized for an online shop." },
  { client: "mamaPut", title: "Food photography for our new menu", category: "Photography", budget: 45, skills: "Food photography, Lighting, Editing", posted: 2, due: 8, description: "18 dishes, shot at our kitchen in Lagos on one afternoon. Natural, appetising, not over-edited. Deliver high-res and Instagram crops." },
  // Translation
  { client: "learnly", title: "Translate course videos to Yoruba subtitles", category: "Translation", budget: 40, skills: "Yoruba, Subtitles", posted: 140, due: 12, description: "6 videos, about 15 minutes each. Deliver .srt files. Accuracy matters more than speed." },
  { client: "sunrise", title: "Translate patient leaflets into Igbo and Hausa", category: "Translation", budget: 55, skills: "Igbo, Hausa, Medical translation", posted: 22, due: 11, description: "Four one-page leaflets (malaria, vaccines, antenatal care, hygiene). Simple words, medically accurate. Teams welcome: one translator per language." },
  // Data & Research
  { client: "nova", title: "Research: 50 freelance communities in West Africa", category: "Data & Research", budget: 20, skills: "Research, Spreadsheets", posted: 200, due: 5, description: "A spreadsheet with name, platform, size, focus and contact link for 50 active freelancer communities." },
  { client: "sunrise", title: "Clean and chart 2 years of clinic visit data", category: "Data & Research", budget: 65, skills: "Excel, Python, Data cleaning, Charts", posted: 36, due: 10, description: "About 9,000 rows across several messy Excel files. Merge, clean, and give us a one-page dashboard: visits per month, top conditions, busiest days." },
  // Teaching & Tutoring
  { client: "learnly", title: "JAMB physics tutor for 8 weekend classes", category: "Teaching & Tutoring", budget: 45, skills: "Physics, JAMB prep", posted: 160, due: 30, description: "Live online classes for a group of 12 students, Saturdays and Sundays. Share your lesson plan when you apply." },
  { client: "greenRoots", title: "Teach 4 Excel classes to our field staff", category: "Teaching & Tutoring", budget: 35, skills: "Excel, Training", posted: 80, due: 15, description: "Beginner level, online, 90 minutes each: entering data, simple formulas, filters and charts. Include practice files." },
  // Virtual Assistance
  { client: "sunrise", title: "Virtual assistant for appointment booking (4 weeks)", category: "Virtual Assistance", budget: 80, skills: "Google Workspace, Scheduling, Customer support", posted: 12, due: 28, description: "Answer WhatsApp and email enquiries, book patients into our calendar and send reminders the day before. About 2 hours a day, weekdays." },
  { client: "ekpe", title: "Upload 200 products to our online store", category: "Virtual Assistance", budget: 18, skills: "Data entry, Shopify", posted: 48, due: 5, description: "We send a spreadsheet and photos. Create each product with title, price, stock, photos and category. Careful work, no typos." },
  // Other
  { client: "kora", title: "MC for a product launch evening in Accra", category: "Other", budget: 60, skills: "Public speaking, Events, MC", posted: 40, due: 12, description: "Host a 2-hour launch event for about 150 guests: welcome, introduce speakers, run a short Q&A and a giveaway. English and Twi a plus." },
];

type DemoApp = { gig: string; lead: Key; pitch: string; link?: string; split: [description: string, member: Key, amount: number][]; posted: number };

const apps: DemoApp[] = [
  { gig: "Brand kit for a bakery in Uyo", lead: "ada", posted: 12, pitch: "We're a three-person crew in Uyo: I lead and do the logo, Tunde draws the illustrations, Ifeoma does packaging mockups. We did a similar kit for a cafe last month and can deliver in 10 days.", split: [["Logo and design lead", "ada", 15], ["Illustrations", "tunde", 10], ["Packaging mockups", "ifeoma", 5]] },
  { gig: "Brand kit for a bakery in Uyo", lead: "kwame", posted: 4, pitch: "I can do the full kit solo in 12 days. I'll start with three logo directions so you can pick early, then build the illustrations and mockups around it.", split: [["Full brand kit", "kwame", 28]] },
  { gig: "Mobile app UI for a savings wallet (Figma)", lead: "kwame", posted: 3, pitch: "I designed two savings apps last year (happy to share them on a call). I'll run a quick usability test with 5 people before final handoff.", split: [["Wireframes + user test", "kwame", 70], ["Final UI + prototype", "kwame", 110]] },
  { gig: "Mobile app UI for a savings wallet (Figma)", lead: "ada", posted: 1, pitch: "Ada and Ifeoma: I handle UI and the component library, Ifeoma makes the app-store mockups and onboarding illustrations.", split: [["UI and components", "ada", 130], ["Illustrations and store mockups", "ifeoma", 45]] },
  { gig: "Landing page for an online school (Next.js)", lead: "emem", posted: 24, pitch: "I build Next.js sites every week. I'll match your Figma pixel for pixel, hit 95+ on Lighthouse, and wire the form to your API.", split: [["Pages built from Figma", "emem", 80], ["Form + API + launch", "emem", 40]] },
  { gig: "Landing page for an online school (Next.js)", lead: "efe", posted: 20, pitch: "Backend-leaning dev, but I ship clean Tailwind front ends too. I'll add form validation and spam protection on the API side.", split: [["Landing page + form", "efe", 110]] },
  { gig: "WhatsApp ordering bot for a restaurant", lead: "emem", posted: 30, pitch: "Efe and I built a WhatsApp bot for a pharmacy chain. He does the bot and order flow, I build the kitchen screen.", split: [["Bot and order flow", "efe", 90], ["Kitchen order screen", "emem", 60]] },
  { gig: "Review a small Soroban vesting contract", lead: "efe", posted: 40, pitch: "I've written and tested three Soroban contracts on testnet. You'll get a report with each finding ranked by severity, plus failing tests that prove them.", split: [["Review report + tests", "efe", 300]] },
  { gig: "5 blog posts explaining stablecoin payments", lead: "zainab", posted: 48, pitch: "I write for fintech brands and explain money topics simply. Happy to send an outline for all five posts first.", split: [["Five posts", "zainab", 50]] },
  { gig: "5 blog posts explaining stablecoin payments", lead: "grace", posted: 30, pitch: "Technical writer with a fintech background. I'll include a simple diagram in each post so readers see how the money moves.", split: [["Five posts with diagrams", "grace", 50]] },
  { gig: "Grant proposal for a clean-water project", lead: "grace", posted: 5, pitch: "Water and sanitation proposals are most of my work. Two of my last three proposals were funded. I'll need your budget sheet and any past reports.", split: [["Draft proposal", "grace", 45], ["Final edits + submission pack", "grace", 25]] },
  { gig: "Edit 10 Instagram Reels from raw footage", lead: "kelechi", posted: 60, pitch: "Reels are my daily work. I'll add hooks in the first 2 seconds, trending sounds and your logo outro. First 3 in 48 hours.", split: [["10 edited Reels", "kelechi", 25]] },
  { gig: "Edit 10 Instagram Reels from raw footage", lead: "tobi", posted: 50, pitch: "I'll add animated captions and a short logo sting you can reuse on every video.", split: [["Reels + logo sting", "tobi", 25]] },
  { gig: "60-second animated explainer for a payments app", lead: "tobi", posted: 10, pitch: "Team of three: I write the script and animate, Kelechi handles the edit and sound design, Amaka records the voice-over in her studio.", split: [["Script, storyboard and animation", "tobi", 140], ["Edit and sound design", "kelechi", 45], ["Voice-over", "amaka", 35]] },
  { gig: "Manage our Instagram and TikTok for one month", lead: "aniekan", posted: 90, pitch: "I manage two other Uyo food brands and know what your customers like. Weekly content plan every Monday, report at month end.", split: [["One month of social", "aniekan", 60]] },
  { gig: "TikTok launch campaign for a new Afrobeats single", lead: "aniekan", posted: 8, pitch: "I'll run the campaign and creator outreach; Zainab writes the hooks and captions. Our last launch got 1.2M views in 10 days.", split: [["Campaign + creators", "aniekan", 65], ["Hooks and captions", "zainab", 25]] },
  { gig: "Mix and master a 4-track EP", lead: "amaka", posted: 40, pitch: "Afrobeats is my lane. I'll send a reference mix of track 1 within 3 days so you can confirm the sound before I do the rest.", split: [["Mix 4 tracks", "amaka", 80], ["Master 4 tracks", "amaka", 30]] },
  { gig: "Product photos for 40 items, white background", lead: "femi", posted: 110, pitch: "My studio is 10 minutes from your store. I can shoot on site in one day and deliver edited photos in three.", split: [["40 product photos", "femi", 30]] },
  { gig: "Translate course videos to Yoruba subtitles", lead: "bisi", posted: 100, pitch: "Native Yoruba speaker, five years subtitling. I time every line by hand so it reads naturally.", split: [["6 subtitle files", "bisi", 40]] },
  { gig: "Translate patient leaflets into Igbo and Hausa", lead: "hauwa", posted: 6, pitch: "I'm a former nurse and translate health material for two NGOs. I'll do Hausa and Igbo myself and have a second speaker proofread each.", split: [["Hausa leaflets", "hauwa", 28], ["Igbo leaflets", "hauwa", 27]] },
  { gig: "Research: 50 freelance communities in West Africa", lead: "yusuf", posted: 150, pitch: "I'll verify each community is active (posts in the last 30 days) and add member counts with the date checked.", split: [["Research spreadsheet", "yusuf", 20]] },
  { gig: "Clean and chart 2 years of clinic visit data", lead: "yusuf", posted: 20, pitch: "I clean health data in Python and build dashboards in Power BI or Google Sheets, whichever your team prefers.", split: [["Cleaned dataset", "yusuf", 35], ["Dashboard", "yusuf", 30]] },
  { gig: "JAMB physics tutor for 8 weekend classes", lead: "chidi", posted: 120, pitch: "I've prepared 200+ students for JAMB. Lesson plan attached on request: mechanics first, then waves, electricity and past questions.", split: [["8 weekend classes", "chidi", 45]] },
  { gig: "Virtual assistant for appointment booking (4 weeks)", lead: "ngozi", posted: 7, pitch: "I do patient booking for a dental clinic now, so I know how to keep a calendar tidy and reminders on time.", split: [["Week 1–2", "ngozi", 40], ["Week 3–4", "ngozi", 40]] },
  { gig: "Upload 200 products to our online store", lead: "ngozi", posted: 30, pitch: "Fast and careful with Shopify. I'll double-check every price against your sheet before publishing.", split: [["200 product uploads", "ngozi", 18]] },
];

/** True if the database has at least one gig (demo or not). */
export async function hasGigs(db: DB) {
  return (await db.select({ id: schema.gigs.id }).from(schema.gigs).limit(1)).length > 0;
}

export async function hasDemoData(db: DB) {
  return (await db.select({ id: schema.gigs.id }).from(schema.gigs).where(eq(schema.gigs.demo, true)).limit(1)).length > 0;
}

export async function seedDemo(db: DB) {
  const now = Date.now();
  const a = {} as Record<Key, string>;
  for (const p of people) a[p.key] = Keypair.random().publicKey();

  await db.insert(schema.users).values(
    people.map((p, i) => ({
      address: a[p.key],
      name: p.name,
      headline: p.headline,
      category: p.category,
      skills: p.skills,
      location: p.location,
      bio: p.bio,
      link: "",
      demo: true,
      createdAt: new Date(now - (60 - i) * DAY),
    })),
  );

  const gigIds: Record<string, string> = {};
  await db.insert(schema.gigs).values(
    gigs.map((g) => {
      const gid = (gigIds[g.title] = id());
      return {
        id: gid,
        clientAddress: a[g.client],
        title: g.title,
        description: g.description,
        category: g.category,
        skills: g.skills,
        budget: g.budget,
        deadline: new Date(now + g.due * DAY),
        demo: true,
        createdAt: new Date(now - g.posted * HOUR),
      };
    }),
  );

  await db.insert(schema.applications).values(
    apps.map((x) => {
      const milestones = x.split.map(([description, member, amount]) => ({
        description,
        memberName: people.find((p) => p.key === member)!.name.split(" ")[0],
        receiver: a[member],
        amount,
      }));
      if (!gigIds[x.gig]) throw new Error(`Demo application points at a missing gig: ${x.gig}`);
      return {
        id: id(),
        gigId: gigIds[x.gig],
        leadAddress: a[x.lead],
        pitch: x.pitch,
        link: x.link ?? "",
        milestones,
        total: milestones.reduce((s, m) => s + m.amount, 0),
        createdAt: new Date(now - x.posted * HOUR),
      };
    }),
  );

  return { people: people.length, gigs: gigs.length, applications: apps.length };
}

/** Deletes every demo row (and any application a real user sent to a demo gig). */
export async function removeDemo(db: DB) {
  const demoGigs = db.select({ id: schema.gigs.id }).from(schema.gigs).where(eq(schema.gigs.demo, true));
  const demoUsers = db.select({ a: schema.users.address }).from(schema.users).where(eq(schema.users.demo, true));
  const [apps] = await db.batch([
    db.delete(schema.applications).where(inArray(schema.applications.gigId, demoGigs)).returning({ id: schema.applications.id }),
    db.delete(schema.applications).where(inArray(schema.applications.leadAddress, demoUsers)),
  ]);
  const removedGigs = await db.delete(schema.gigs).where(eq(schema.gigs.demo, true)).returning({ id: schema.gigs.id });
  const removedUsers = await db.delete(schema.users).where(eq(schema.users.demo, true)).returning({ a: schema.users.address });
  return { gigs: removedGigs.length, people: removedUsers.length, applications: apps.length };
}

/**
 * Keeps an old demo looking alive: if the newest demo gig is more than a day old, shift every
 * demo gig (posted date and deadline) and demo application forward so the newest is about 2 hours old.
 * Real users' rows are never touched. Returns the shift in days (0 if nothing changed).
 */
export async function refreshDemoDates(db: DB) {
  const [row] = await db
    .select({ newest: sql<number | null>`max(${schema.gigs.createdAt})` })
    .from(schema.gigs)
    .where(eq(schema.gigs.demo, true));
  if (!row?.newest) return 0;
  // Timestamps are stored in seconds.
  const shift = Math.floor(Date.now() / 1000) - Number(row.newest) - 2 * 3600;
  if (shift < 24 * 3600) return 0;
  const demoGigs = db.select({ id: schema.gigs.id }).from(schema.gigs).where(eq(schema.gigs.demo, true));
  const demoUsers = db.select({ a: schema.users.address }).from(schema.users).where(eq(schema.users.demo, true));
  await db.batch([
    db
      .update(schema.applications)
      .set({ createdAt: sql`${schema.applications.createdAt} + ${shift}` })
      .where(and(inArray(schema.applications.gigId, demoGigs), inArray(schema.applications.leadAddress, demoUsers))),
    db
      .update(schema.gigs)
      .set({ createdAt: sql`${schema.gigs.createdAt} + ${shift}`, deadline: sql`${schema.gigs.deadline} + ${shift}` })
      .where(eq(schema.gigs.demo, true)),
  ]);
  return Math.round(shift / 86400);
}
