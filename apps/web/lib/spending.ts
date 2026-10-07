// Small calculations the overview shows in words. Totals themselves always come from the API.
import type { CategoryPoint } from "@/lib/models";

const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

export type CategorySlice = { name: string; totalMinor: number; color: string };

/** The biggest `count` categories, with everything else (and "Other" itself) folded into Other. */
export function topCategories(points: CategoryPoint[], count = 4): CategorySlice[] {
  const named = points.filter((p) => p.category !== "Other");
  const top = named.slice(0, count).map((p, i) => ({ name: p.category, totalMinor: p.total_minor, color: SERIES[i] }));
  const rest = points.filter((p) => !top.some((t) => t.name === p.category));
  const restMinor = rest.reduce((sum, p) => sum + p.total_minor, 0);
  return restMinor > 0 ? [...top, { name: "Other", totalMinor: restMinor, color: "var(--ink-4)" }] : top;
}

/** "Food & Dining" → "Food", for tight spaces. */
export function shortCategory(name: string): string {
  return name.split(" & ")[0];
}

/** How big a part is, the way a person would say it: "a third", "about half", "18%". */
export function shareLabel(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  const share = part / whole;
  if (share > 0.45 && share < 0.55) return "about half";
  if (share > 0.3 && share < 0.37) return "a third";
  if (share > 0.22 && share < 0.28) return "a quarter";
  return `${Math.round(share * 100)}%`;
}
