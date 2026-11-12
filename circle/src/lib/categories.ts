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
