"use client";

import { cn } from "@/lib/cn";
import { setConfidence, useNoteProgress } from "@/lib/progress";

const labels = ["—", "lost", "shaky", "ok", "solid", "exam-ready"];

export function ConfidenceSlider({ slug }: { slug: string }) {
  const p = useNoteProgress(slug);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-wider text-[var(--color-muted)]">Confidence</span>
        <span className="font-mono text-[var(--color-text)]">{labels[p.confidence]}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setConfidence(slug, p.confidence === n ? 0 : n)}
            aria-label={`Confidence ${n}`}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              n <= p.confidence ? "bg-[var(--color-accent)]" : "bg-[var(--color-surface-2)] hover:bg-[var(--color-border-strong)]"
            )}
          />
        ))}
      </div>
    </div>
  );
}
