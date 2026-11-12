import type { Category } from "./categories";

/** Starting points for "Post a gig". Each one is a realistic, editable example. */
export const GIG_TEMPLATES: { label: string; title: string; category: Category; skills: string; budget: number; days: number; description: string }[] = [
  {
    label: "Logo & brand kit",
    title: "Logo and brand kit for my business",
    category: "Design",
    skills: "Logo, Branding, Figma",
    budget: 40,
    days: 14,
    description:
      "I need a logo and a simple brand kit for my business.\n\nDeliverables:\n• Logo (full colour, black and white, and an icon)\n• Colour palette and fonts\n• 3 social media templates\n\nAbout us: [what you do and who your customers are]\nStyle I like: [links or a few words]",
  },
  {
    label: "Website",
    title: "Mobile-friendly website for a small business",
    category: "Development",
    skills: "Next.js, WordPress, SEO",
    budget: 120,
    days: 21,
    description:
      "Build a fast website that works well on phones.\n\nPages: Home, About, Services, Contact (with a WhatsApp button).\nI'll provide: text and photos.\nPlease include: hosting setup and a short handover video.\n\nShare links to sites you've built when you apply.",
  },
  {
    label: "Social media",
    title: "Run our Instagram and TikTok for a month",
    category: "Marketing & Social",
    skills: "Instagram, TikTok, Content calendar",
    budget: 60,
    days: 30,
    description:
      "Plan and post 3 times a week on Instagram and TikTok, reply to comments, and send a short report at the end of the month.\n\nAbout us: [your business]\nGoal: [more followers, more orders, a launch…]",
  },
  {
    label: "Short videos",
    title: "Edit 10 short videos for Reels and TikTok",
    category: "Video & Animation",
    skills: "Reels, CapCut, Captions",
    budget: 30,
    days: 7,
    description:
      "We'll send raw phone videos. Edit 10 short videos (15–30 seconds) with captions, music and our logo at the end. Vertical 9:16.\n\nFirst 2 videos within 3 days so we can give feedback.",
  },
  {
    label: "Translation",
    title: "Translate documents into a local language",
    category: "Translation",
    skills: "Yoruba, Igbo, Hausa",
    budget: 35,
    days: 10,
    description:
      "Translate [number] pages from English into [language]. Simple, everyday words; accuracy matters more than speed.\n\nDeliver an editable Word or Google Docs file.",
  },
  {
    label: "Tutoring",
    title: "Weekend tutor for exam prep",
    category: "Teaching & Tutoring",
    skills: "Maths, JAMB prep, WAEC",
    budget: 45,
    days: 30,
    description:
      "Live online classes for [number] students, [days and times]. Subject: [subject]. Share a short lesson plan when you apply.",
  },
];
