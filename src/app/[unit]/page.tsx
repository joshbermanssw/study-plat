import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { mdxOptions } from "@/lib/mdx-options";
import { getUnitData } from "@/lib/content";
import { CountdownChip } from "@/components/countdown-chip";
import { UnitUploader } from "@/components/unit-uploader";
import { formatExamDate } from "@/lib/dates";
import { isVisibleNote } from "@/lib/visibility";

export default async function UnitPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  const data = getUnitData(unit);
  if (!data) notFound();

  // A week shows up if it has a topic from the USyd schedule OR it has at least
  // one visible note (downloaded / edited).
  const weeks = data.weeks
    .map((wk) => ({ ...wk, visibleNotes: wk.notes.filter(isVisibleNote) }))
    .filter((wk) => wk.topic || wk.visibleNotes.length > 0);

  const visibleNoteCount = weeks.reduce((acc, w) => acc + w.visibleNotes.length, 0);
  const hiddenCount = data.allNotes.length - visibleNoteCount - (data.overview ? 1 : 0) - data.exam.length;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-3">
        <div className="font-mono text-xs text-[var(--color-muted)]">{data.code}</div>
        <h1 className="text-3xl font-semibold tracking-tight">{data.name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
          <CountdownChip examDate={data.examDate} />
          {data.examDate && <span>· {formatExamDate(data.examDate)}</span>}
          <span>· {visibleNoteCount} notes</span>
          <span>· {weeks.length} weeks</span>
          {hiddenCount > 0 && (
            <Link href="/sync" className="text-[var(--color-accent)] hover:underline">
              · {hiddenCount} not downloaded
            </Link>
          )}
        </div>
      </div>

      {data.overview ? (
        <div className="prose-note">
          <MDXRemote source={data.overview.body} options={mdxOptions} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
          <p className="mb-2 font-medium text-[var(--color-text)]">No overview yet.</p>
          <p>Create <code>content/units/{data.code}/_unit.mdx</code> with frontmatter <code>type: overview</code> to populate this page.</p>
        </div>
      )}

      <section className="mt-10 flex flex-col gap-3">
        {weeks.map((wk) => (
          <article key={wk.week} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <header className="mb-2 flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-2)]">Week {String(wk.week).padStart(2, "0")}</span>
                {wk.topic && <h2 className="text-base font-medium leading-tight">{wk.topic}</h2>}
              </div>
              <span className="shrink-0 font-mono text-[10px] text-[var(--color-muted-2)]">{wk.visibleNotes.length}/{wk.notes.length}</span>
            </header>
            {wk.summary && (
              <p className="mb-3 text-sm leading-relaxed text-[#d4d4d8]">{wk.summary}</p>
            )}
            {wk.visibleNotes.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1 border-t border-[var(--color-border)] pt-3 text-sm">
                {wk.visibleNotes.map((n) => {
                  const isAi = n.type === "ai-overview";
                  const label = isAi ? "AI Overview" : n.type;
                  const title = isAi ? `Teach Me - Week ${wk.week} Overview` : n.title;
                  return (
                    <li key={n.slug} className="truncate">
                      <Link href={n.href} className="text-[#d4d4d8] hover:text-[var(--color-accent)]">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted-2)]">{label}</span>
                        <span className="mx-2 text-[var(--color-border-strong)]">·</span>
                        {title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-2 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted-2)]">
                No notes for this week yet — drop PDFs below or <Link href="/sync" className="text-[var(--color-accent)] hover:underline">grab from Canvas</Link>.
              </div>
            )}
          </article>
        ))}
        {weeks.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
            Nothing scheduled yet for this unit. Topics live in <code>src/lib/weekly-topics.ts</code>.
          </div>
        )}
      </section>

      <UnitUploader unit={data.code} knownWeeks={weeks.map((w) => w.week)} />
    </div>
  );
}
