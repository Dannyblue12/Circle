// Filtering and sorting for the gig list. Pure functions, shared by the server (first render
// from the URL) and the browser (instant updates as you type).
import { CATEGORIES } from "./categories";

export const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "budget-high", label: "Highest budget" },
  { id: "budget-low", label: "Lowest budget" },
  { id: "closing", label: "Closing soon" },
  { id: "fewest", label: "Fewest applicants" },
] as const;
export type Sort = (typeof SORTS)[number]["id"];

export const BUDGETS = [
  { id: "", label: "Any budget", min: 0, max: Infinity },
  { id: "under-50", label: "Under 50", min: 0, max: 50 },
  { id: "50-150", label: "50–150", min: 50, max: 150 },
  { id: "150-plus", label: "150+", min: 150, max: Infinity },
] as const;
export type Budget = (typeof BUDGETS)[number]["id"];

export type GigFilters = { q: string; category: string; sort: Sort; budget: Budget; saved: boolean };
export const NO_FILTERS: GigFilters = { q: "", category: "", sort: "newest", budget: "", saved: false };

type Params = Record<string, string | string[] | undefined> | URLSearchParams;
const get = (p: Params, k: string) => {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k];
  return (Array.isArray(v) ? v[0] : v) ?? "";
};

export function parseFilters(p: Params): GigFilters {
  const category = get(p, "category");
  const sort = get(p, "sort");
  const budget = get(p, "budget");
  return {
    q: get(p, "q").slice(0, 100),
    category: (CATEGORIES as readonly string[]).includes(category) ? category : "",
    sort: SORTS.some((s) => s.id === sort) ? (sort as Sort) : "newest",
    budget: BUDGETS.some((b) => b.id === budget) ? (budget as Budget) : "",
    saved: get(p, "saved") === "1",
  };
}

export function filtersToQuery(f: GigFilters) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.category) p.set("category", f.category);
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.budget) p.set("budget", f.budget);
  if (f.saved) p.set("saved", "1");
  return p.toString();
}

export function activeFilterCount(f: GigFilters) {
  return [f.q.trim(), f.category, f.budget, f.saved].filter(Boolean).length;
}

type FilterableGig = {
  id: string;
  title: string;
  description: string;
  skills: string;
  category: string;
  budget: number;
  applicants: number;
  deadline: Date | null;
  createdAt: Date;
  client: { name: string } | null;
};

/** Every word must appear somewhere in the gig (title, description, skills, category or client). */
function matchesQuery(g: FilterableGig, q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = `${g.title} ${g.description} ${g.skills} ${g.category} ${g.client?.name ?? ""}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

/** Everything except the category, so category chips can show how many results each would give. */
function matchesBase<G extends FilterableGig>(g: G, f: GigFilters, saved: readonly string[]) {
  const b = BUDGETS.find((x) => x.id === f.budget) ?? BUDGETS[0];
  return matchesQuery(g, f.q) && g.budget >= b.min && g.budget < b.max && (!f.saved || saved.includes(g.id));
}

export function applyFilters<G extends FilterableGig>(gigs: G[], f: GigFilters, saved: readonly string[] = []) {
  const base = gigs.filter((g) => matchesBase(g, f, saved));
  const counts: Record<string, number> = { "": base.length };
  for (const g of base) counts[g.category] = (counts[g.category] ?? 0) + 1;
  const list = (f.category ? base.filter((g) => g.category === f.category) : base).slice();
  const time = (d: Date | null) => (d ? new Date(d).getTime() : Infinity);
  list.sort((a, b) => {
    switch (f.sort) {
      case "budget-high":
        return b.budget - a.budget;
      case "budget-low":
        return a.budget - b.budget;
      case "closing":
        return time(a.deadline) - time(b.deadline);
      case "fewest":
        return a.applicants - b.applicants || time(b.createdAt) - time(a.createdAt);
      default:
        return time(b.createdAt) - time(a.createdAt);
    }
  });
  return { list, counts };
}
