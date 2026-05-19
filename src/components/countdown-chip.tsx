import { cn } from "@/lib/cn";
import { countdownTone, formatExamDate, humanCountdown } from "@/lib/dates";

const toneClass: Record<ReturnType<typeof countdownTone>, string> = {
  ok:     "bg-[var(--color-accent-soft)] text-[var(--color-accent)] ring-[var(--color-accent)]/40",
  warn:   "bg-[#3a2e0a] text-[var(--color-warning)] ring-[var(--color-warning)]/40",
  danger: "bg-[#3a0e10] text-[var(--color-danger)] ring-[var(--color-danger)]/40",
  past:   "bg-[var(--color-surface-2)] text-[var(--color-muted)] ring-[var(--color-border)]",
};

export function CountdownChip({ examDate, compact }: { examDate?: Date; compact?: boolean }) {
  const tone = countdownTone(examDate);
  return (
    <span
      title={formatExamDate(examDate)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        toneClass[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {compact ? humanCountdown(examDate) : `Exam ${humanCountdown(examDate)}`}
    </span>
  );
}
