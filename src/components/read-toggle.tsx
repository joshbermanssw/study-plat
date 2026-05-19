"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { setRead, useNoteProgress } from "@/lib/progress";

export function ReadToggle({ slug }: { slug: string }) {
  const p = useNoteProgress(slug);
  return (
    <button
      onClick={() => setRead(slug, !p.read)}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
        p.read
          ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
      )}
    >
      <Check className={cn("size-3.5", !p.read && "opacity-30")} />
      {p.read ? "Read" : "Mark as read"}
    </button>
  );
}
