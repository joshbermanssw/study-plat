"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CountdownChip } from "./countdown-chip";
import { meanConfidence, readPercent, useMountedProgress } from "@/lib/progress";
import type { UnitData } from "@/lib/types";
import { cn } from "@/lib/cn";

export function UnitCard({ unit }: { unit: UnitData }) {
  const progress = useMountedProgress();
  const slugs = unit.allNotes.map((n) => n.slug);
  const pct = readPercent(progress, slugs);
  const conf = meanConfidence(progress, slugs);

  return (
    <Link
      href={`/${unit.code}`}
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]",
        "p-5 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="size-9 rounded-lg border border-[var(--color-border)]"
            style={{ background: `linear-gradient(135deg, ${unit.color}30, ${unit.color}05)`, boxShadow: `inset 0 0 0 1px ${unit.color}40` }}
          />
          <div>
            <div className="font-mono text-xs text-[var(--color-muted)]">{unit.code}</div>
            <div className="text-base font-medium tracking-tight">{unit.name}</div>
          </div>
        </div>
        <ArrowUpRight className="size-4 text-[var(--color-muted)] transition group-hover:text-[var(--color-text)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>

      <CountdownChip examDate={unit.examDate} />

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Stat label="Notes done" value={`${Math.round(pct * 100)}%`} />
        <Stat label="Confidence" value={conf.toFixed(1) + " / 5"} />
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: unit.color }} />
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-2)]">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
