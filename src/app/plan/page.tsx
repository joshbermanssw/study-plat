import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CountdownChip } from "@/components/countdown-chip";
import { PLAN, unitTotals, type Emphasis } from "@/lib/study-plan";
import { UNITS, getUnit } from "@/lib/units";
import { flattenNotesForSearch } from "@/lib/content";
import { formatExamDate } from "@/lib/dates";
import { cn } from "@/lib/cn";

const emphasisStyle: Record<Emphasis, string> = {
  foundation: "bg-[var(--color-accent-soft)]/30 text-[var(--color-accent)]",
  mid:        "bg-[#1a2e3a] text-[#7dd3fc]",
  deep:       "bg-[#3a1f2e] text-[#f9a8d4]",
  "exam-prep":"bg-[#3a2e0a] text-[var(--color-warning)]",
  "exam-day": "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
  rest:       "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
};

const emphasisLabel: Record<Emphasis, string> = {
  foundation: "Foundation",
  mid:        "Mid-content",
  deep:       "Deep dive",
  "exam-prep":"Exam prep",
  "exam-day": "Exam day",
  rest:       "Rest / light",
};

export default function PlanPage() {
  const searchIndex = flattenNotesForSearch();
  const totals = unitTotals();
  const today = new Date().toDateString();

  return (
    <AppShell searchIndex={searchIndex}>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Study calendar</h1>
          <p className="text-sm text-[var(--color-muted)]">
            30-day parallel-exam plan. Five phases: foundation → mid → deep → exam-prep → exam days. Edit
            <code className="ml-1 font-mono text-xs">src/lib/study-plan.ts</code> to tweak.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {UNITS.map((u) => {
            const total = totals.find((t) => t.unit === u.code);
            return (
              <Link key={u.code} href={`/${u.code}`} className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-surface-2)]">
                <div className="font-mono text-[10px] text-[var(--color-muted-2)]">{u.code}</div>
                <div className="mt-1 truncate text-sm font-medium">{u.name}</div>
                <div className="mt-2"><CountdownChip examDate={u.examDate} compact /></div>
                <div className="mt-3 flex items-baseline justify-between border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-muted)]">
                  <span>{total ? `${total.hours.toFixed(1)} hrs` : "—"}</span>
                  <span className="font-mono text-[10px]">{total ? `${total.sessions} sess` : ""}</span>
                </div>
                {u.examDate && (
                  <div className="mt-1 text-[10px] text-[var(--color-muted-2)]">{formatExamDate(u.examDate)}</div>
                )}
              </Link>
            );
          })}
        </section>

        <section className="flex flex-col gap-3">
          {PLAN.map((day) => {
            const isToday = day.date.toDateString() === today;
            const isPast = day.date < new Date(new Date().toDateString());
            return (
              <article
                key={day.date.toISOString()}
                className={cn(
                  "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-opacity",
                  isPast && "opacity-50",
                  isToday && "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30",
                )}
              >
                <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-2)]">
                      {day.date.toLocaleDateString("en-AU", { weekday: "short" })}
                    </span>
                    <span className="text-lg font-medium tracking-tight">
                      {day.date.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px]", emphasisStyle[day.emphasis])}>
                      {emphasisLabel[day.emphasis]}
                    </span>
                    {isToday && <span className="font-mono text-[10px] text-[var(--color-accent)]">· today</span>}
                  </div>
                  {day.callout && (
                    <span className="text-xs italic text-[var(--color-muted)]">{day.callout}</span>
                  )}
                </header>
                <ul className="flex flex-col divide-y divide-[var(--color-border)]">
                  {day.sessions.map((s, i) => {
                    const unit = s.unit !== "—" ? getUnit(s.unit) : undefined;
                    return (
                      <li key={i} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                        <div className="flex min-w-0 items-baseline gap-2">
                          {s.unit !== "—" && unit ? (
                            <Link
                              href={`/${s.unit}`}
                              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]"
                              style={{ background: `${unit.color}20`, color: unit.color }}
                            >
                              {s.unit}
                            </Link>
                          ) : (
                            <span className="shrink-0 rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-muted-2)]">—</span>
                          )}
                          <span className="truncate text-[#d4d4d8]">{s.topic}</span>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--color-muted)]">{s.hours}h</span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
