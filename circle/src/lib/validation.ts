import { z } from "zod";
import { CATEGORIES } from "./categories";

const address = z.string().trim().regex(/^G[A-Z2-7]{55}$/, "Enter a valid Stellar address (starts with G)");
const amount = z.coerce.number().positive("Amounts must be more than 0").max(1_000_000);
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => !v || /^https?:\/\//.test(v), "Links must start with https://")
  .default("");

export const milestoneSchema = z.object({
  description: z.string().trim().min(2, "Describe each milestone").max(80),
  memberName: z.string().trim().min(1, "Name each team member").max(40),
  receiver: address,
  amount,
});
export const milestonesSchema = z.array(milestoneSchema).min(1, "Add at least one milestone").max(10, "Up to 10 milestones");

export const gigSchema = z.object({
  title: z.string().trim().min(5, "Title is too short").max(100),
  description: z.string().trim().min(20, "Describe the job in at least 20 characters").max(4000),
  category: z.enum(CATEGORIES),
  skills: z.string().trim().max(200).default(""),
  budget: amount,
  deadline: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => !d || !isNaN(d.getTime()), "Invalid deadline"),
});

export const applicationSchema = z.object({
  pitch: z.string().trim().min(20, "Tell the client why you're a fit (20+ characters)").max(2000),
  link: optionalUrl,
  milestones: milestonesSchema,
});

export const projectSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(2000).default(""),
  clientAddress: address,
  milestones: milestonesSchema,
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Add your name").max(60),
  headline: z.string().trim().max(100).default(""),
  bio: z.string().trim().max(1500).default(""),
  category: z.union([z.enum(CATEGORIES), z.literal("")]).default(""),
  skills: z.string().trim().max(200).default(""),
  location: z.string().trim().max(60).default(""),
  link: optionalUrl,
});

export const linkSchema = z.object({
  amount,
  description: z.string().trim().min(2, "What is it for?").max(80),
});

export const prepareSchema = z.object({
  action: z.enum(["deploy", "fund", "done", "approve", "dispute"]),
  idx: z.coerce.number().int().min(0).optional(),
  evidence: z.string().trim().max(300).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const submitSchema = z.object({ intent: z.string().min(10), signedXdr: z.string().min(10) });

export function total(ms: { amount: number }[]) {
  return Number(ms.reduce((s, m) => s + m.amount, 0).toFixed(7));
}
