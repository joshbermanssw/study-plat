"use client";

import { Flame } from "lucide-react";
import { useMountedProgress } from "@/lib/progress";

export function StreakChip() {
  const p = useMountedProgress();
  const n = p.streak.currentStreak;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs">
      <Flame className="size-3.5 text-[var(--color-warning)]" />
      <span className="font-mono">{n}</span>
      <span className="text-[var(--color-muted)]">day{n === 1 ? "" : "s"}</span>
    </div>
  );
}
