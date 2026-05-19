import type { NoteStatus } from "@/lib/types";

const styles: Record<NoteStatus, { label: string; cls: string }> = {
  stub:   { label: "stub",   cls: "bg-[var(--color-surface-2)] text-[var(--color-warning)]" },
  synced: { label: "synced", cls: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" },
  draft:  { label: "draft",  cls: "bg-[var(--color-surface-2)] text-[var(--color-text)]" },
  done:   { label: "done",   cls: "bg-[var(--color-success)]/10 text-[var(--color-success)]" },
};

export function StatusPill({ status }: { status?: NoteStatus }) {
  if (!status) return null;
  const s = styles[status];
  if (!s) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${s.cls}`}>
      {s.label}
    </span>
  );
}
