"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, FileText, FlaskConical, GraduationCap, BookOpen, NotebookPen, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMountedProgress } from "@/lib/progress";
import { isVisibleNote } from "@/lib/visibility";
import type { UnitData, Note } from "@/lib/types";

const typeIcon: Record<Note["type"], React.ComponentType<{ className?: string }>> = {
  lecture: FileText,
  lab: FlaskConical,
  tutorial: NotebookPen,
  reading: BookOpen,
  overview: GraduationCap,
  exam: GraduationCap,
  "ai-overview": Sparkles,
};

export function WeekNav({ unit }: { unit: UnitData }) {
  const pathname = usePathname();
  const progress = useMountedProgress();
  const visibleWeeks = unit.weeks
    .map((wk) => ({ ...wk, notes: wk.notes.filter(isVisibleNote) }))
    .filter((wk) => wk.topic || wk.notes.length > 0);
  const [open, setOpen] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    for (const w of visibleWeeks) init[w.week] = true;
    return init;
  });

  return (
    <nav className="flex flex-col gap-1 py-2 text-sm">
      {unit.overview && (
        <NavLink href={unit.overview.href} active={pathname === unit.overview.href}>
          <GraduationCap className="size-3.5" /> Overview
        </NavLink>
      )}
      {visibleWeeks.map((wk) => {
        const isOpen = open[wk.week];
        const doneCount = wk.notes.filter((n) => progress.notes[n.slug]?.read).length;
        return (
          <div key={wk.week}>
            <button
              onClick={() => setOpen((o) => ({ ...o, [wk.week]: !o[wk.week] }))}
              className="flex w-full items-start justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[var(--color-surface-2)]"
            >
              <span className="flex min-w-0 flex-1 items-start gap-1.5">
                <ChevronRight className={cn("mt-0.5 size-3 shrink-0 transition-transform", isOpen && "rotate-90")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Week {wk.week}</span>
                  {wk.topic && (
                    <span className="block truncate text-[12px] leading-snug text-[#d4d4d8]" title={wk.topic}>{wk.topic}</span>
                  )}
                </span>
              </span>
              {wk.notes.length > 0 && (
                <span className="mt-1 shrink-0 font-mono text-[10px] text-[var(--color-muted-2)]">{doneCount}/{wk.notes.length}</span>
              )}
            </button>
            {isOpen && (
              <div className="ml-3 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-2">
                {wk.notes.map((n) => {
                  const Icon = typeIcon[n.type] ?? FileText;
                  const isRead = !!progress.notes[n.slug]?.read;
                  const isAi = n.type === "ai-overview";
                  const title = isAi ? `Teach Me - Week ${wk.week} Overview` : n.title;
                  return (
                    <NavLink key={n.slug} href={n.href} active={pathname === n.href}>
                      <Icon className="size-3.5 shrink-0 text-[var(--color-muted)]" />
                      <span className={cn("flex-1 truncate", isRead && "text-[var(--color-muted)] line-through decoration-[var(--color-muted-2)]/50")}>
                        {title}
                      </span>
                      {n.status === "stub" && <span className="font-mono text-[9px] text-[var(--color-muted-2)]">stub</span>}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {unit.exam.length > 0 && (
        <div className="mt-3 border-t border-[var(--color-border)] pt-3">
          <div className="px-2 py-1 text-xs uppercase tracking-wider text-[var(--color-muted)]">Exam</div>
          {unit.exam.map((n) => (
            <NavLink key={n.slug} href={n.href} active={pathname === n.href}>
              <GraduationCap className="size-3.5" /> {n.title}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          : "text-[#d4d4d8] hover:bg-[var(--color-surface-2)]"
      )}
    >
      {children}
    </Link>
  );
}
