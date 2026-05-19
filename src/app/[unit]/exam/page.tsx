import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getUnitData } from "@/lib/content";
import { CountdownChip } from "@/components/countdown-chip";

export default async function ExamPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  const data = getUnitData(unit);
  if (!data) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href={`/${data.code}`} className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
        ← back to {data.code}
      </Link>
      <header className="my-6 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Exam mode · {data.code}</h1>
        <CountdownChip examDate={data.examDate} />
      </header>

      {data.exam.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
          No exam-section notes yet. Drop files into <code>content/units/{data.code}/exam/</code> like <code>topics.mdx</code> and <code>cheatsheet.mdx</code>.
        </div>
      )}

      <div className="flex flex-col gap-8">
        {data.exam.map((n) => (
          <section key={n.slug} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">{n.title}</h2>
            <div className="prose-note"><MDXRemote source={n.body} /></div>
          </section>
        ))}
      </div>
    </div>
  );
}
