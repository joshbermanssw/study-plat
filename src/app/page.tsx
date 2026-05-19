import { getAllUnits, flattenNotesForSearch } from "@/lib/content";
import { UnitCard } from "@/components/unit-card";
import { AppShell } from "@/components/app-shell";

export default function HomePage() {
  const units = getAllUnits();
  const index = flattenNotesForSearch();

  return (
    <AppShell searchIndex={index}>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Study dashboard</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Four units. One month. Pick a card.
          </p>
        </header>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {units.map((u) => <UnitCard key={u.code} unit={u} />)}
        </section>
        <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Tip title="1. Sync Canvas" body="Run pnpm sync once with your Canvas token in .env.local to pull modules, files, and exam dates." />
          <Tip title="2. Generate notes" body="Open Claude Code in this repo and ask me to flesh out stubs in /content/units/<UNIT>." />
          <Tip title="3. Study" body="Tick notes as read, rate confidence 1–5, watch the streak grow. State persists in this browser." />
        </section>
      </div>
    </AppShell>
  );
}

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-1 text-xs uppercase tracking-wider text-[var(--color-muted)]">{title}</div>
      <p className="text-sm text-[#d4d4d8]">{body}</p>
    </div>
  );
}
