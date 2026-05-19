"use client";

import { useCallback, useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, X, Loader2, Check, AlertCircle, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { uploadManualFile, type UploadResult } from "@/app/sync/actions";

interface Props {
  unit: string;
  /** Weeks that already have content — used to pre-fill the week selector with a sensible default. */
  knownWeeks: number[];
}

interface Queued {
  id: string;
  file: File;
  week: number;
  type: "lecture" | "lab" | "tutorial" | "reading";
  title: string;
  state:
    | { kind: "idle" }
    | { kind: "uploading" }
    | { kind: "done"; result: UploadResult }
    | { kind: "error"; message: string };
}

const TYPES = ["lecture", "lab", "tutorial", "reading"] as const;

function inferType(name: string): Queued["type"] {
  const t = name.toLowerCase();
  if (/(lec|lecture|week\s*\d|slides)/.test(t)) return "lecture";
  if (/(lab|practical)/.test(t)) return "lab";
  if (/(tut|tutorial|workshop)/.test(t)) return "tutorial";
  return "reading";
}

function inferWeek(name: string, fallback: number): number {
  const m = name.match(/week[\s_-]*(\d{1,2})/i) ?? name.match(/\bw(\d{1,2})\b/i) ?? name.match(/^0?(\d{1,2})[_-]/);
  return m ? Number(m[1]) : fallback;
}

export function UnitUploader({ unit, knownWeeks }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<Queued[]>([]);
  const [dragging, setDragging] = useState(false);
  const [, startTransition] = useTransition();

  const defaultWeek = knownWeeks.length > 0 ? Math.max(...knownWeeks) + 1 : 1;

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const accepted = arr.filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    const rejected = arr.length - accepted.length;
    if (rejected > 0) {
      window.alert(`${rejected} non-PDF file${rejected === 1 ? "" : "s"} ignored. Only PDFs are accepted.`);
    }
    const next: Queued[] = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      week: inferWeek(file.name, defaultWeek),
      type: inferType(file.name),
      title: file.name.replace(/\.[^.]+$/, ""),
      state: { kind: "idle" },
    }));
    setQueue((q) => [...q, ...next]);
  }, [defaultWeek]);

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const update = (id: string, patch: Partial<Queued>) =>
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const remove = (id: string) => setQueue((q) => q.filter((it) => it.id !== id));

  const uploadAll = () => {
    const pending = queue.filter((it) => it.state.kind === "idle");
    if (pending.length === 0) return;
    for (const item of pending) update(item.id, { state: { kind: "uploading" } });

    startTransition(async () => {
      for (const item of pending) {
        const fd = new FormData();
        fd.set("file", item.file);
        fd.set("unit", unit);
        fd.set("week", String(item.week));
        fd.set("type", item.type);
        fd.set("title", item.title);
        try {
          const res = await uploadManualFile(fd);
          update(item.id, { state: res.ok ? { kind: "done", result: res } : { kind: "error", message: res.message ?? "failed" } });
        } catch (e) {
          update(item.id, { state: { kind: "error", message: (e as Error).message } });
        }
      }
      router.refresh();
    });
  };

  return (
    <section className="mt-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-medium">Upload your own files</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Drop PDFs Canvas didn&apos;t cover — textbook chapters, past papers, your own scans. Text is extracted and a new <code className="font-mono text-[10px]">synced</code> note is created.
          </p>
        </div>
      </header>

      <label
        htmlFor={`uploader-${unit}`}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed py-8 text-sm transition-colors",
          dragging
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
            : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
        )}
      >
        <Upload className="size-5" />
        <span>Drop PDFs here or <span className="text-[var(--color-accent)] underline underline-offset-2">click to choose</span></span>
        <span className="text-[10px] text-[var(--color-muted-2)]">PDF files only · text extracted and stamped into the new note</span>
        <input
          ref={inputRef}
          id={`uploader-${unit}`}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
        />
      </label>

      {queue.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {queue.map((item) => (
            <QueueRow key={item.id} item={item} onUpdate={update} onRemove={remove} />
          ))}
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => setQueue((q) => q.filter((it) => it.state.kind !== "idle"))}
              disabled={queue.every((it) => it.state.kind !== "idle")}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs hover:text-[var(--color-text)] disabled:opacity-30"
            >
              Clear pending
            </button>
            <button
              onClick={uploadAll}
              disabled={queue.every((it) => it.state.kind !== "idle")}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-30"
            >
              <Upload className="size-3.5" /> Upload {queue.filter((it) => it.state.kind === "idle").length} file(s)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function QueueRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: Queued;
  onUpdate: (id: string, patch: Partial<Queued>) => void;
  onRemove: (id: string) => void;
}) {
  const disabled = item.state.kind !== "idle";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
      <FileIcon className="size-4 shrink-0 text-[var(--color-muted)]" />
      <input
        type="text"
        value={item.title}
        onChange={(e) => onUpdate(item.id, { title: e.target.value })}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:opacity-60"
      />
      <span className="font-mono text-[10px] text-[var(--color-muted-2)]">{fmtSize(item.file.size)}</span>
      <span className="text-[10px] text-[var(--color-muted-2)]">Week</span>
      <input
        type="number"
        min={0}
        max={99}
        value={item.week}
        onChange={(e) => onUpdate(item.id, { week: Number(e.target.value) })}
        disabled={disabled}
        className="w-12 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-center text-xs outline-none disabled:opacity-60"
      />
      <select
        value={item.type}
        onChange={(e) => onUpdate(item.id, { type: e.target.value as Queued["type"] })}
        disabled={disabled}
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-xs outline-none disabled:opacity-60"
      >
        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <RowState item={item} />
      <button
        onClick={() => onRemove(item.id)}
        disabled={item.state.kind === "uploading"}
        className="text-[var(--color-muted-2)] hover:text-[var(--color-danger)] disabled:opacity-30"
        title="Remove"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function RowState({ item }: { item: Queued }) {
  if (item.state.kind === "uploading") {
    return <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)]"><Loader2 className="size-3 animate-spin" /> uploading…</span>;
  }
  if (item.state.kind === "done" && item.state.result.ok) {
    return (
      <Link href={item.state.result.href ?? "#"} className="inline-flex items-center gap-1 text-xs text-[var(--color-success)] hover:underline">
        <Check className="size-3.5" /> open note
      </Link>
    );
  }
  if (item.state.kind === "error") {
    return <span title={item.state.message} className="inline-flex items-center gap-1 text-xs text-[var(--color-danger)]"><AlertCircle className="size-3.5" /> {item.state.message.slice(0, 40)}</span>;
  }
  return null;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
