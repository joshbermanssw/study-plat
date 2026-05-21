import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { PLAN, type Emphasis } from "@/lib/study-plan";
import { getUnit } from "@/lib/units";
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

export function TodayPanel() {
  const today = new Date().toDateString();
  const day = PLAN.find((p) => p.date.toDateString() === today);

  if (!day) {
    // Either before May 19 or after final exam.
    const finished = new Date() > PLAN[PLAN.length - 1].date;
    return (
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Calendar className="size-4" />
          {finished ? "Exams done — you're free." : "Today isn't in the plan yet."}
          <Link href="/plan" className="ml-auto text-[var(--color-accent)] hover:underline">View plan →</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-surface)] p-5">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-2)]">Today</span>
          <h2 className="text-lg font-semibold tracking-tight">
            {day.date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}
          </h2>
          <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px]", emphasisStyle[day.emphasis])}>
            {emphasisLabel[day.emphasis]}
          </span>
          {day.callout && (
            <span className="text-xs italic text-[var(--color-muted)]">{day.callout}</span>
          )}
        </div>
        <Link href="/plan" className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline">
          Full plan <ArrowRight className="size-3" />
        </Link>
      </header>
      <ul className="flex flex-col divide-y divide-[var(--color-border)] text-sm">
        {day.sessions.map((s, i) => {
          const unit = s.unit !== "—" ? getUnit(s.unit) : undefined;
          return (
            <li key={i} className="flex items-baseline justify-between gap-3 py-1.5">
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
    </section>
  );
}
