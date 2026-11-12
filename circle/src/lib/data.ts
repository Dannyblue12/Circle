import "server-only";
import { randomUUID } from "crypto";
import { connection } from "next/server";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { applications, db, gigs, milestones, payLinks, projects, users, type User } from "./db";

// Every read calls connection() first so Next renders it per request, never at build time.

// Table-qualified on purpose: in a single-table select Drizzle prints bare column names,
// and a bare "id" inside the subquery would mean applications.id, not gigs.id.
const applicantCount = sql<number>`(select count(*) from ${applications} where ${applications}.gig_id = ${gigs}.id)`;

/** A fresh id per server render. Used as a React key to reset client state on a real navigation. */
export async function requestId() {
  await connection();
  return randomUUID();
}

export async function getUsers(addresses: string[]): Promise<Record<string, User>> {
  const unique = [...new Set(addresses.filter(Boolean))];
  if (!unique.length) return {};
  const rows = await db.select().from(users).where(inArray(users.address, unique));
  return Object.fromEntries(rows.map((u) => [u.address, u]));
}

export async function getUser(address: string) {
  await connection();
  return (await db.query.users.findFirst({ where: eq(users.address, address) })) ?? null;
}

export async function listGigs(opts: { q?: string; category?: string; status?: "OPEN" | "ALL"; limit?: number }) {
  await connection();
  const where = [];
  if (opts.status !== "ALL") where.push(eq(gigs.status, "OPEN"));
  if (opts.category) where.push(eq(gigs.category, opts.category));
  if (opts.q) {
    const q = `%${opts.q}%`;
    where.push(or(like(gigs.title, q), like(gigs.description, q), like(gigs.skills, q)));
  }
  const rows = await db
    .select({
      gig: gigs,
      applicants: applicantCount,
    })
    .from(gigs)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(gigs.createdAt))
    .limit(opts.limit ?? 60);
  const clients = await getUsers(rows.map((r) => r.gig.clientAddress));
  return rows.map((r) => ({ ...r.gig, applicants: Number(r.applicants), client: clients[r.gig.clientAddress] ?? null }));
}

export async function getGig(id: string) {
  await connection();
  const gig = await db.query.gigs.findFirst({ where: eq(gigs.id, id) });
  if (!gig) return null;
  const apps = await db.select().from(applications).where(eq(applications.gigId, id)).orderBy(desc(applications.createdAt));
  const people = await getUsers([gig.clientAddress, ...apps.map((a) => a.leadAddress)]);
  return {
    ...gig,
    client: people[gig.clientAddress] ?? null,
    applications: apps.map((a) => ({ ...a, lead: people[a.leadAddress] ?? null })),
  };
}

/** Other open gigs in the same category (then any category), for "More gigs like this". */
export async function similarGigs(gig: { id: string; category: string }, limit = 3) {
  const open = await listGigs({ limit: 60 });
  const others = open.filter((g) => g.id !== gig.id);
  return [...others.filter((g) => g.category === gig.category), ...others.filter((g) => g.category !== gig.category)].slice(0, limit);
}

export async function earningsFor(address: string) {
  const rows = await db
    .select({ amount: milestones.amount, status: milestones.status, toReceiver: milestones.toReceiver })
    .from(milestones)
    .where(and(eq(milestones.receiver, address), inArray(milestones.status, ["RELEASED", "RESOLVED"])));
  const total = rows.reduce((s, r) => s + (r.status === "RELEASED" ? r.amount : r.toReceiver ?? 0), 0);
  return { total, jobs: rows.length };
}

export async function listTalent(opts: { q?: string; category?: string }) {
  await connection();
  const where = [sql`${users.name} != ''`];
  if (opts.category) where.push(eq(users.category, opts.category));
  if (opts.q) {
    const q = `%${opts.q}%`;
    where.push(or(like(users.name, q), like(users.headline, q), like(users.skills, q))!);
  }
  const rows = await db.select().from(users).where(and(...where)).orderBy(desc(users.createdAt)).limit(60);
  const earnings = await db
    .select({
      receiver: milestones.receiver,
      total: sql<number>`sum(case when ${milestones.status} = 'RELEASED' then ${milestones.amount} else coalesce(${milestones.toReceiver}, 0) end)`,
      jobs: sql<number>`count(*)`,
    })
    .from(milestones)
    .where(and(inArray(milestones.receiver, rows.map((r) => r.address).concat("")), inArray(milestones.status, ["RELEASED", "RESOLVED"])))
    .groupBy(milestones.receiver);
  const byAddr = Object.fromEntries(earnings.map((e) => [e.receiver, e]));
  return rows
    .map((u) => ({ ...u, earned: Number(byAddr[u.address]?.total ?? 0), jobs: Number(byAddr[u.address]?.jobs ?? 0) }))
    .sort((a, b) => b.earned - a.earned);
}

export async function getProjectView(id: string) {
  await connection();
  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) return null;
  const ms = await db.select().from(milestones).where(eq(milestones.projectId, id)).orderBy(milestones.idx);
  const people = await getUsers([project.clientAddress, project.leadAddress]);
  return { ...project, milestones: ms, client: people[project.clientAddress] ?? null, lead: people[project.leadAddress] ?? null };
}

export async function projectsFor(address: string) {
  const memberOf = db.select({ id: milestones.projectId }).from(milestones).where(eq(milestones.receiver, address));
  const rows = await db
    .select()
    .from(projects)
    .where(or(eq(projects.clientAddress, address), eq(projects.leadAddress, address), inArray(projects.id, memberOf)))
    .orderBy(desc(projects.createdAt));
  if (!rows.length) return [];
  const ms = await db.select().from(milestones).where(inArray(milestones.projectId, rows.map((r) => r.id)));
  return rows.map((p) => ({ ...p, milestones: ms.filter((m) => m.projectId === p.id).sort((a, b) => a.idx - b.idx) }));
}

export async function getDashboard(address: string) {
  await connection();
  const [myGigs, myApps, myProjects, myLinks, earnings] = await Promise.all([
    db
      .select({
        gig: gigs,
        applicants: applicantCount,
      })
      .from(gigs)
      .where(eq(gigs.clientAddress, address))
      .orderBy(desc(gigs.createdAt)),
    db
      .select({ app: applications, gig: gigs })
      .from(applications)
      .innerJoin(gigs, eq(gigs.id, applications.gigId))
      .where(eq(applications.leadAddress, address))
      .orderBy(desc(applications.createdAt)),
    projectsFor(address),
    db.select().from(payLinks).where(eq(payLinks.ownerAddress, address)).orderBy(desc(payLinks.createdAt)).limit(20),
    earningsFor(address),
  ]);
  const locked = myProjects
    .filter((p) => p.clientAddress === address && p.funded)
    .flatMap((p) => p.milestones)
    .filter((m) => !["RELEASED", "RESOLVED"].includes(m.status))
    .reduce((s, m) => s + m.amount, 0);
  return {
    gigs: myGigs.map((r) => ({ ...r.gig, applicants: Number(r.applicants) })),
    applications: myApps,
    projects: myProjects,
    links: myLinks,
    earnings,
    locked,
  };
}

export async function getLink(id: string) {
  await connection();
  const link = await db.query.payLinks.findFirst({ where: eq(payLinks.id, id) });
  if (!link) return null;
  const owner = await db.query.users.findFirst({ where: eq(users.address, link.ownerAddress) });
  return { ...link, owner: owner ?? null };
}

export async function listDisputes() {
  await connection();
  const rows = await db
    .select({ m: milestones, p: projects })
    .from(milestones)
    .innerJoin(projects, eq(projects.id, milestones.projectId))
    .where(inArray(milestones.status, ["DISPUTED", "RESOLVED"]))
    .orderBy(desc(milestones.updatedAt));
  return rows;
}

/** Open gigs per category, for the category chips on the home page. */
export async function categoryCounts(): Promise<Record<string, number>> {
  await connection();
  const rows = await db
    .select({ category: gigs.category, n: sql<number>`count(*)` })
    .from(gigs)
    .where(eq(gigs.status, "OPEN"))
    .groupBy(gigs.category);
  return Object.fromEntries(rows.map((r) => [r.category, Number(r.n)]));
}

export async function stats() {
  await connection();
  const [g] = await db.select({ n: sql<number>`count(*)` }).from(gigs).where(eq(gigs.status, "OPEN"));
  const [paid] = await db
    .select({ total: sql<number>`coalesce(sum(case when ${milestones.status} = 'RELEASED' then ${milestones.amount} else coalesce(${milestones.toReceiver},0) end), 0)` })
    .from(milestones)
    .where(inArray(milestones.status, ["RELEASED", "RESOLVED"]));
  const [t] = await db.select({ n: sql<number>`count(*)` }).from(users).where(sql`${users.name} != ''`);
  return { openGigs: Number(g?.n ?? 0), paidOut: Number(paid?.total ?? 0), talent: Number(t?.n ?? 0) };
}
