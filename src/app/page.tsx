import { getAllUnits, flattenNotesForSearch } from "@/lib/content";
import { UnitCard } from "@/components/unit-card";
import { AppShell } from "@/components/app-shell";
import { TodayPanel } from "@/components/today-panel";

// Today's date depends on server time when this renders; rebuild on each hit.
export const dynamic = "force-dynamic";

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

        <div className="mb-8">
          <TodayPanel />
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {units.map((u) => <UnitCard key={u.code} unit={u} />)}
        </section>
      </div>
    </AppShell>
  );
}
