import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { WeekNav } from "@/components/week-nav";
import { CountdownChip } from "@/components/countdown-chip";
import { flattenNotesForSearch, getUnitData } from "@/lib/content";

export default async function UnitLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ unit: string }>;
}) {
  const { unit } = await params;
  const data = getUnitData(unit);
  if (!data) notFound();
  const index = flattenNotesForSearch();

  return (
    <AppShell
      searchIndex={index}
      sidebar={
        <div>
          <div className="border-b border-[var(--color-border)] px-2 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-2)]">{data.code}</div>
            <div className="mt-0.5 truncate text-sm font-medium">{data.name}</div>
            <div className="mt-2"><CountdownChip examDate={data.examDate} compact /></div>
          </div>
          <WeekNav unit={data} />
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
