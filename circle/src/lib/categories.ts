// "Anybody with a skill in any area or career" — keep this list broad.
export const CATEGORIES = [
  "Design",
  "Development",
  "Writing & Content",
  "Video & Animation",
  "Marketing & Social",
  "Music & Audio",
  "Photography",
  "Translation",
  "Data & Research",
  "Teaching & Tutoring",
  "Virtual Assistance",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** A few common skills per category, offered as one-tap suggestions when posting a gig. */
export const SKILL_SUGGESTIONS: Record<Category, string[]> = {
  Design: ["Figma", "Logo", "Branding", "UI design", "Illustration", "Packaging", "Canva"],
  Development: ["Next.js", "React", "Node", "WordPress", "Flutter", "Python", "Soroban"],
  "Writing & Content": ["Copywriting", "Blog posts", "SEO", "Editing", "Grant writing", "Scripts"],
  "Video & Animation": ["Reels", "CapCut", "Premiere Pro", "After Effects", "2D animation", "Captions"],
  "Marketing & Social": ["Instagram", "TikTok", "Content calendar", "Ads", "Influencers", "Email"],
  "Music & Audio": ["Mixing", "Mastering", "Jingles", "Voice-over", "Podcast editing"],
  Photography: ["Product photography", "Food photography", "Events", "Editing", "Lightroom"],
  Translation: ["Yoruba", "Igbo", "Hausa", "French", "Swahili", "Subtitles"],
  "Data & Research": ["Excel", "Research", "Data cleaning", "Python", "Power BI", "Surveys"],
  "Teaching & Tutoring": ["Maths", "Physics", "English", "JAMB prep", "WAEC", "Excel training"],
  "Virtual Assistance": ["Data entry", "Scheduling", "Customer support", "Google Workspace", "Shopify"],
  Other: ["Events", "Public speaking", "Errands", "Consulting"],
};
