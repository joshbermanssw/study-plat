import Link from "next/link";
import { StreakChip } from "./streak";
import { CmdK } from "./cmd-k";
import type { Note } from "@/lib/types";

export function AppShell({
  children,
  sidebar,
  searchIndex,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  searchIndex: Array<Note & { unitName: string }>;
}) {
  return (
    <div className="flex min-h-screen">
      {sidebar && (
        <aside className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex md:flex-col">
          <Link href="/" className="block border-b border-[var(--color-border)] px-4 py-3">
            <div className="text-[11px] uppercase tracking-widest text-[var(--color-muted-2)]">Study Platform</div>
            <div className="text-sm font-medium">Dashboard</div>
          </Link>
          <div className="flex-1 overflow-y-auto px-2">{sidebar}</div>
        </aside>
      )}
      <main className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">/ home</Link>
            <Link href="/plan" className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">/ plan</Link>
            <Link href="/sync" className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">/ source files</Link>
          </div>
          <div className="flex items-center gap-3">
            <CmdK index={searchIndex} />
            <StreakChip />
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
