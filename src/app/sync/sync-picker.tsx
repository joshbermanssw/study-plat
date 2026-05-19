"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Download, FileText, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { downloadCanvasItems, reExtractItems, type ItemResult } from "./actions";

export interface SyncItem {
  unit: string;
  unitName: string;
  unitColor?: string;
  slug: string;
  title: string;
  week?: number;
  module?: string;
  type: string;
  downloaded: boolean;
  hasExtract: boolean;
  localFile?: string;
  fileSize?: number;
  fetchedAt?: Date;
}

type RowState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; result: ItemResult }
  | { status: "error"; message: string };

export function SyncPicker({ items }: { items: SyncItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [showDownloaded, setShowDownloaded] = useState(false);
  const [filterUnit, setFilterUnit] = useState<string>("ALL");
  const [pending, startTransition] = useTransition();

  const units = useMemo(() => Array.from(new Set(items.map((i) => i.unit))).sort(), [items]);

  const visible = useMemo(() => {
    return items.filter((i) => {
      if (!showDownloaded && i.downloaded) return false;
      if (filterUnit !== "ALL" && i.unit !== filterUnit) return false;
      return true;
    });
  }, [items, showDownloaded, filterUnit]);

  const key = (i: SyncItem) => `${i.unit}::${i.slug}`;

  function toggle(i: SyncItem) {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = key(i);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }

  function selectVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const i of visible) if (!i.downloaded) next.add(key(i));
      return next;
    });
  }

  function clear() { setSelected(new Set()); }

  function run() {
    if (selected.size === 0) return;
    const picked = items.filter((i) => selected.has(key(i)));

    const pending: Record<string, RowState> = {};
    for (const i of picked) pending[key(i)] = { status: "pending" };
    setRowState((prev) => ({ ...prev, ...pending }));

    startTransition(async () => {
      const results = await downloadCanvasItems(picked.map(({ unit, slug }) => ({ unit, slug })));
      const next: Record<string, RowState> = {};
      for (const r of results) {
        next[`${r.unit}::${r.slug}`] = r.ok
          ? { status: "done", result: r }
          : { status: "error", message: r.message ?? "failed" };
      }
      setRowState((prev) => ({ ...prev, ...next }));
      setSelected(new Set());
    });
  }

  const groupedByUnit = useMemo(() => {
    const map = new Map<string, SyncItem[]>();
    for (const i of visible) {
      if (!map.has(i.unit)) map.set(i.unit, []);
      map.get(i.unit)!.push(i);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.week ?? 99) - (b.week ?? 99) || a.title.localeCompare(b.title));
    }
    return [...map.entries()].sort();
  }, [visible]);

  const pendingCount = items.filter((i) => !i.downloaded).length;
  const doneCount = items.filter((i) => i.downloaded).length;
  const needsExtractCount = items.filter((i) => i.downloaded && !i.hasExtract).length;

  function backfillExtraction() {
    const targets = items.filter((i) => i.downloaded && !i.hasExtract);
    if (targets.length === 0) return;
    const pending: Record<string, RowState> = {};
    for (const i of targets) pending[key(i)] = { status: "pending" };
    setRowState((prev) => ({ ...prev, ...pending }));
    startTransition(async () => {
      const results = await reExtractItems(targets.map(({ unit, slug }) => ({ unit, slug })));
      const next: Record<string, RowState> = {};
      for (const r of results) {
        next[`${r.unit}::${r.slug}`] = r.ok
          ? { status: "done", result: r }
          : { status: "error", message: r.message ?? "failed" };
      }
      setRowState((prev) => ({ ...prev, ...next }));
    });
  }

  return (
    <>
      {needsExtractCount > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-3 py-2 text-sm">
          <span className="text-[var(--color-warning)]">
            {needsExtractCount} downloaded file{needsExtractCount === 1 ? "" : "s"} {needsExtractCount === 1 ? "doesn't" : "don't"} have extracted text yet
          </span>
          <button
            onClick={backfillExtraction}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-warning)] px-3 py-1 text-xs font-medium text-black hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Backfill text extraction
          </button>
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono text-[var(--color-muted)]">{doneCount} downloaded · {pendingCount} pending</span>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-xs"
          >
            <option value="ALL">All units</option>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            <input type="checkbox" checked={showDownloaded} onChange={(e) => setShowDownloaded(e.target.checked)} />
            show downloaded
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={selectVisible}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs hover:text-[var(--color-text)]"
          >
            Select visible
          </button>
          <button
            onClick={clear}
            disabled={selected.size === 0}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs hover:text-[var(--color-text)] disabled:opacity-30"
          >
            Clear
          </button>
          <button
            onClick={run}
            disabled={selected.size === 0 || pending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              selected.size === 0
                ? "border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted-2)]"
                : "bg-[var(--color-accent)] text-white hover:opacity-90",
            )}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Download {selected.size > 0 ? `${selected.size} ` : ""}selected
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {groupedByUnit.map(([unit, rows]) => (
          <section key={unit}>
            <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <span className="size-1.5 rounded-full" style={{ background: rows[0]?.unitColor }} />
              {unit} · {rows[0]?.unitName}
              <span className="font-mono text-[10px] text-[var(--color-muted-2)]">({rows.length})</span>
            </h2>
            <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              {rows.map((i) => {
                const k = key(i);
                const state = rowState[k];
                const isSelected = selected.has(k);
                return (
                  <li key={k} className={cn("flex items-center gap-3 px-3 py-2 text-sm", isSelected && "bg-[var(--color-accent-soft)]/30")}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={i.downloaded || state?.status === "pending" || state?.status === "done"}
                      onChange={() => toggle(i)}
                      className="size-4 accent-[var(--color-accent)]"
                    />
                    <FileText className="size-4 shrink-0 text-[var(--color-muted)]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{i.title}</div>
                      <div className="truncate text-[10px] uppercase tracking-wider text-[var(--color-muted-2)]">
                        {i.week != null && <>week {i.week} · </>}{i.type}
                        {i.module && <> · {i.module}</>}
                      </div>
                    </div>
                    <RowStatus item={i} state={state} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {visible.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
            Nothing to show. {showDownloaded ? "" : "Tick 'show downloaded' if you've already pulled everything."}
          </div>
        )}
      </div>
    </>
  );
}

function RowStatus({ item, state }: { item: SyncItem; state: RowState | undefined }) {
  if (state?.status === "pending") {
    return <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)]"><Loader2 className="size-3 animate-spin" /> working…</span>;
  }
  if (state?.status === "done" && state.result.ok) {
    const r = state.result;
    const parts: string[] = [];
    if (r.size != null) parts.push(fmtSize(r.size));
    if (r.extractedChars != null) parts.push(`text ✓ ${shortNum(r.extractedChars)}`);
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-success)]">
        <Check className="size-3.5" /> {parts.join(" · ")}
      </span>
    );
  }
  if (state?.status === "error") {
    return <span title={state.message} className="inline-flex items-center gap-1 text-xs text-[var(--color-danger)]"><AlertCircle className="size-3.5" /> {short(state.message)}</span>;
  }
  if (item.downloaded) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-success)]">
        <Check className="size-3.5" />
        {fmtSize(item.fileSize)}
        {!item.hasExtract && <span className="text-[var(--color-warning)]" title="No extracted text yet">· no text</span>}
      </span>
    );
  }
  return null;
}

function shortNum(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}

function fmtSize(bytes?: number): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function short(s: string, n = 40): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
