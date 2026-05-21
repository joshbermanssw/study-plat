import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { mdxOptions } from "@/lib/mdx-options";
import { getNote, getUnitData } from "@/lib/content";
import { ReadToggle } from "@/components/read-toggle";
import { ConfidenceSlider } from "@/components/confidence-slider";
import { StatusPill } from "@/components/status-pill";
import { NoteView } from "./note-view";

function localFileToApiUrl(localFile?: string): string | undefined {
  if (!localFile) return undefined;
  const prefix = "data/sources/";
  if (!localFile.startsWith(prefix)) return undefined;
  const rest = localFile.slice(prefix.length);
  return "/api/sources/" + rest.split("/").map((s) => encodeURIComponent(s)).join("/");
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ unit: string; slug: string[] }>;
}) {
  const { unit, slug } = await params;
  const data = getUnitData(unit);
  if (!data) notFound();
  const note = getNote(unit, slug);
  if (!note) notFound();

  const pdfUrl = localFileToApiUrl(note.localFile);
  const pdfFilename = note.localFile?.split("/").pop();
  const preview = <MDXRemote source={note.body} options={mdxOptions} />;

  return (
    <div className="mx-auto grid w-full max-w-[110rem] grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[1fr_240px]">
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[var(--color-muted)]">{data.code}</span>
          {note.week != null && <span className="text-[var(--color-muted)]">· Week {note.week}</span>}
          <span className="text-[var(--color-muted)]">· {note.type}</span>
          <StatusPill status={note.status} />
          {note.editedAt && (
            <span className="font-mono text-[10px] text-[var(--color-muted-2)]" title={note.editedAt.toISOString()}>
              edited {note.editedAt.toLocaleDateString("en-AU")}
            </span>
          )}
          {note.examWeight && (
            <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-accent)]">
              {note.examWeight} exam weight
            </span>
          )}
        </header>
        <h1 className="text-2xl font-semibold tracking-tight">{note.title}</h1>

        <NoteView
          unit={data.code}
          slug={note.slug}
          rawBody={note.body}
          preview={preview}
          pdfUrl={pdfUrl}
          pdfFilename={pdfFilename}
        />
      </div>

      <aside className="xl:sticky xl:top-20 xl:self-start">
        <div className="flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <ReadToggle slug={note.slug} />
          <ConfidenceSlider slug={note.slug} />
          {(note.sourceFile || note.canvasUrl || note.localFile) && (
            <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3 text-xs">
              <div className="uppercase tracking-wider text-[var(--color-muted-2)]">Source</div>
              {note.sourceFile && (
                <div className="break-all font-mono text-[11px] text-[var(--color-muted)]">{note.sourceFile}</div>
              )}
              {note.localFile ? (
                <div className="inline-flex items-center gap-1 rounded-md bg-[var(--color-success)]/10 px-2 py-1 text-[11px] text-[var(--color-success)]">
                  ✓ local
                </div>
              ) : (
                note.canvasUrl && (
                  <a href={note.canvasUrl} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] hover:underline">
                    Open in Canvas ↗
                  </a>
                )
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
