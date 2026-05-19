import type { UnitMeta } from "./types";

/**
 * Static unit registry. Canvas sync writes courseId + name; exam dates and
 * accent colours live here so they're easy to edit by hand.
 *
 * Dates use `new Date(year, monthIndex, day, hour?, minute?)` — `monthIndex`
 * is 0-based (Jan = 0, Jun = 5, Dec = 11). Add hour/minute once Canvas
 * publishes the exam slot, e.g. `new Date(2026, 5, 16, 14, 0)` for 16 Jun 2 pm.
 */
export const UNITS: UnitMeta[] = [
  { code: "COMP4347", name: "Web Application Development", examDate: new Date(2026, 5, 16), color: "#7c5cff" },
  { code: "COMP4349", name: "Cloud Computing",             examDate: new Date(2026, 5, 13), color: "#4ade80" },
  { code: "INFO4444", name: "Computing 4 Innovation",      examDate: new Date(2026, 5, 15), color: "#fbbf24" },
  { code: "COMP3027", name: "Algorithm Design",            examDate: new Date(2026, 5, 17), color: "#f87171" },
];

export function getUnit(code: string): UnitMeta | undefined {
  return UNITS.find((u) => u.code.toLowerCase() === code.toLowerCase());
}
