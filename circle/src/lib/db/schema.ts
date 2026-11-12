import { sqliteTable, text, real, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

const now = () => new Date();

export const users = sqliteTable("users", {
  address: text("address").primaryKey(),
  name: text("name").notNull().default(""),
  headline: text("headline").notNull().default(""),
  bio: text("bio").notNull().default(""),
  category: text("category").notNull().default(""),
  skills: text("skills").notNull().default(""), // comma separated
  location: text("location").notNull().default(""),
  link: text("link").notNull().default(""),
  /** Sample account created by the demo seed (random keypair nobody holds). */
  demo: integer("demo", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const gigs = sqliteTable(
  "gigs",
  {
    id: text("id").primaryKey(),
    clientAddress: text("client_address").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    skills: text("skills").notNull().default(""),
    budget: real("budget").notNull(),
    deadline: integer("deadline", { mode: "timestamp" }),
    status: text("status", { enum: ["OPEN", "HIRED", "CLOSED"] }).notNull().default("OPEN"),
    projectId: text("project_id"),
    /** Sample gig from the demo seed: shown with a "Sample" tag, its client can't hire. */
    demo: integer("demo", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  },
  (t) => [index("gigs_status_cat").on(t.status, t.category), index("gigs_client").on(t.clientAddress)],
);

export type MilestoneDraft = { description: string; memberName: string; receiver: string; amount: number };

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    gigId: text("gig_id").notNull().references(() => gigs.id, { onDelete: "cascade" }),
    leadAddress: text("lead_address").notNull(),
    pitch: text("pitch").notNull(),
    link: text("link").notNull().default(""),
    milestones: text("milestones", { mode: "json" }).$type<MilestoneDraft[]>().notNull(),
    total: real("total").notNull(),
    status: text("status", { enum: ["PENDING", "HIRED", "REJECTED"] }).notNull().default("PENDING"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex("app_gig_lead").on(t.gigId, t.leadAddress), index("app_lead").on(t.leadAddress)],
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    clientAddress: text("client_address").notNull(),
    leadAddress: text("lead_address").notNull(),
    gigId: text("gig_id"),
    contractId: text("contract_id"),
    total: real("total").notNull(),
    platformFeePct: real("platform_fee_pct").notNull().default(1),
    funded: integer("funded", { mode: "boolean" }).notNull().default(false),
    deployTx: text("deploy_tx"),
    fundTx: text("fund_tx"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  },
  (t) => [index("proj_client").on(t.clientAddress), index("proj_lead").on(t.leadAddress)],
);

export const MILESTONE_STATUSES = ["PENDING", "DONE", "APPROVED", "RELEASED", "DISPUTED", "RESOLVED"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const milestones = sqliteTable(
  "milestones",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(),
    description: text("description").notNull(),
    memberName: text("member_name").notNull(),
    receiver: text("receiver").notNull(),
    amount: real("amount").notNull(),
    status: text("status", { enum: MILESTONE_STATUSES }).notNull().default("PENDING"),
    evidence: text("evidence").notNull().default(""),
    approveTx: text("approve_tx"),
    releaseTx: text("release_tx"),
    disputeBy: text("dispute_by"),
    disputeReason: text("dispute_reason").notNull().default(""),
    disputeTx: text("dispute_tx"),
    resolveTx: text("resolve_tx"),
    toReceiver: real("to_receiver"),
    toClient: real("to_client"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(now).$onUpdateFn(now),
  },
  (t) => [uniqueIndex("ms_project_idx").on(t.projectId, t.idx), index("ms_receiver").on(t.receiver), index("ms_status").on(t.status)],
);

export const payLinks = sqliteTable(
  "pay_links",
  {
    id: text("id").primaryKey(), // also the transaction memo
    ownerAddress: text("owner_address").notNull(),
    amount: real("amount").notNull(),
    description: text("description").notNull(),
    status: text("status", { enum: ["OPEN", "PAID"] }).notNull().default("OPEN"),
    txHash: text("tx_hash").unique(),
    payer: text("payer"),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  },
  (t) => [index("links_owner").on(t.ownerAddress)],
);

export type User = typeof users.$inferSelect;
export type Gig = typeof gigs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type PayLink = typeof payLinks.$inferSelect;
