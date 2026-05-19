import { differenceInCalendarDays } from "date-fns";

/**
 * Coerce an unknown frontmatter value into a Date. Accepts:
 *  - Date instances (returned as-is)
 *  - ISO-8601 strings ("2026-06-12T09:00:00+10:00", "2026-06-12")
 *  - undefined / null / empty / unparseable → undefined
 *
 * Single source of truth for date parsing — call this everywhere a date
 * crosses a serialization boundary (YAML frontmatter, JSON files, env vars).
 */
export function toDate(v: unknown): Date | undefined {
  if (v == null || v === "") return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

/** Inverse of toDate — for writing back to YAML/JSON. */
export function toIso(d: Date | undefined): string | undefined {
  return d?.toISOString();
}

export function daysUntil(date?: Date): number | undefined {
  if (!date) return undefined;
  return differenceInCalendarDays(date, new Date());
}

export function humanCountdown(date?: Date): string {
  const d = daysUntil(date);
  if (d == null) return "exam date not set";
  if (d < 0) return `${Math.abs(d)} days ago`;
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  return `in ${d} days`;
}

export function formatExamDate(date?: Date): string | undefined {
  if (!date) return undefined;
  return date.toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

export function countdownTone(date?: Date): "ok" | "warn" | "danger" | "past" {
  const d = daysUntil(date);
  if (d == null) return "ok";
  if (d < 0) return "past";
  if (d <= 3) return "danger";
  if (d <= 10) return "warn";
  return "ok";
}
