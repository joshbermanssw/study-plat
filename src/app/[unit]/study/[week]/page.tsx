import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { mdxOptions } from "@/lib/mdx-options";
import { getUnitData } from "@/lib/content";
import { loadQuiz, loadTeach } from "@/lib/quiz";
import { CountdownChip } from "@/components/countdown-chip";
import { StudyView } from "./study-view";
import { isVisibleNote } from "@/lib/visibility";

export const dynamic = "force-dynamic";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ unit: string; week: string }>;
}) {
  const { unit, week: weekParam } = await params;
  const week = Number(weekParam);
  if (!Number.isFinite(week) || week < 0 || week > 99) notFound();

  const data = getUnitData(unit);
  if (!data) notFound();
  const weekData = data.weeks.find((w) => w.week === week);

  const teach = loadTeach(data.code, week);
  const quiz = loadQuiz(data.code, week);

  if (!teach && !quiz && !weekData) notFound();

  const notes = (weekData?.notes ?? [])
    .filter(isVisibleNote)
    .map((n) => ({ href: n.href, title: n.title, type: n.type }));

  const teachContent = teach ? <div className="prose-note"><MDXRemote source={teach.body} options={mdxOptions} /></div> : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href={`/${data.code}`} className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
        ← {data.code}
      </Link>
      <header className="my-4 flex flex-col gap-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-2)]">
          {data.code} · Week {String(week).padStart(2, "0")}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {teach?.title ?? weekData?.topic ?? `Week ${week}`}
        </h1>
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <CountdownChip examDate={data.examDate} compact />
        </div>
      </header>

      {weekData?.summary && (
        <p className="mb-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-relaxed text-[#d4d4d8]">
          {weekData.summary}
        </p>
      )}

      <StudyView teachContent={teachContent} quiz={quiz ?? null} notes={notes} />
    </div>
  );
}
