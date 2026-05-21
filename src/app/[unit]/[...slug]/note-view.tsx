"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Eye, Loader2, Save, PanelRightOpen, PanelRightClose, AlertCircle, Check, Sparkles, Code2, History } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveNoteBody } from "@/app/sync/actions";
import { splitBody, joinBody } from "@/lib/stamp-extract";
import { MilkdownEditor } from "@/components/milkdown-editor";

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; at: number }
  | { status: "error"; message: string };

interface Props {
  unit: string;
  slug: string;
  rawBody: string;
  preview: React.ReactNode;
  pdfUrl?: string;
  pdfFilename?: string;
}

function draftKey(unit: string, slug: string) {
  return `study-platform/draft/${unit}/${slug}`;
}

interface UnsavedDraft { body: string; savedAt: number }

function readDraft(unit: string, slug: string): UnsavedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(unit, slug));
    return raw ? JSON.parse(raw) as UnsavedDraft : null;
  } catch { return null; }
}

function writeDraft(unit: string, slug: string, body: string) {
  try { window.localStorage.setItem(draftKey(unit, slug), JSON.stringify({ body, savedAt: Date.now() })); } catch {}
}

function clearDraft(unit: string, slug: string) {
  try { window.localStorage.removeItem(draftKey(unit, slug)); } catch {}
}

export function NoteView({ unit, slug, rawBody, preview, pdfUrl, pdfFilename }: Props) {
  const router = useRouter();

  // Split the body so the editor never sees the auto-extracted block.
  const initialSplit = useMemo(() => splitBody(rawBody), [rawBody]);
  const preservedRef = useRef(initialSplit.preserved);
  useEffect(() => { preservedRef.current = initialSplit.preserved; }, [initialSplit.preserved]);

  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [editMode, setEditMode] = useState<"rich" | "source">("rich");
  const [editorKey, setEditorKey] = useState(0);   // bump to remount Milkdown with fresh `initial`
  const [userPortion, setUserPortion] = useState(initialSplit.user);
  const [pdfOpen, setPdfOpen] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [recoverable, setRecoverable] = useState<UnsavedDraft | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = userPortion !== initialSplit.user;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: check for an unsaved draft in localStorage that's newer than disk.
  useEffect(() => {
    const draft = readDraft(unit, slug);
    if (draft && draft.body !== initialSplit.user) setRecoverable(draft);
  }, [unit, slug, initialSplit.user]);

  // Mirror userPortion to localStorage on every change (safety net for the ≤1.5s
  // gap between keystroke and server save).
  useEffect(() => {
    if (!dirty) return;
    writeDraft(unit, slug, userPortion);
  }, [userPortion, dirty, unit, slug]);

  const save = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState({ status: "saving" });
    const combined = joinBody(userPortion, preservedRef.current);
    startTransition(async () => {
      const res = await saveNoteBody(unit, slug, combined);
      if (res.ok) {
        setSaveState({ status: "saved", at: Date.now() });
        clearDraft(unit, slug);
        router.refresh();
      } else {
        setSaveState({ status: "error", message: res.message ?? "Save failed" });
      }
    });
  }, [unit, slug, userPortion, router]);

  // Auto-save 1.5s after the last keystroke.
  useEffect(() => {
    if (!dirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [userPortion, dirty, save]);

  // ⌘S / Ctrl-S
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, dirty]);

  return (
    <div className="flex flex-col gap-3">
      {recoverable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 text-[var(--color-warning)]">
            <History className="size-4" />
            Unsaved draft from {new Date(recoverable.savedAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} — not on disk.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setUserPortion(recoverable.body); setEditorKey((k) => k + 1); setMode("edit"); setRecoverable(null); }}
              className="rounded-md bg-[var(--color-warning)] px-3 py-1 text-xs font-medium text-black hover:opacity-90"
            >
              Restore
            </button>
            <button
              onClick={() => { clearDraft(unit, slug); setRecoverable(null); }}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs hover:text-[var(--color-text)]"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className={cn("grid gap-4", pdfUrl && pdfOpen ? "lg:grid-cols-2" : "grid-cols-1")}>
      {/* LHS — editor + preview */}
      <div className="flex min-h-[70vh] flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-md bg-[var(--color-surface-2)] p-0.5 text-xs">
              <TabButton active={mode === "preview"} onClick={() => setMode("preview")} icon={Eye}>Preview</TabButton>
              <TabButton active={mode === "edit"} onClick={() => setMode("edit")} icon={Edit3}>Edit</TabButton>
            </div>
            {mode === "edit" && (
              <div className="flex gap-1 rounded-md bg-[var(--color-surface-2)] p-0.5 text-xs">
                <TabButton
                  active={editMode === "rich"}
                  onClick={() => { setEditorKey((k) => k + 1); setEditMode("rich"); }}
                  icon={Sparkles}
                >Rich</TabButton>
                <TabButton active={editMode === "source"} onClick={() => setEditMode("source")} icon={Code2}>Markdown</TabButton>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <SaveStatus state={saveState} pending={pending} dirty={dirty} />
            <button
              onClick={save}
              disabled={!dirty || pending}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-2 py-1 text-white disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-muted-2)]"
            >
              <Save className="size-3" /> Save
            </button>
            {pdfUrl && (
              <button
                onClick={() => setPdfOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 hover:text-[var(--color-text)]"
                title={pdfOpen ? "Hide PDF" : "Show PDF"}
              >
                {pdfOpen ? <PanelRightClose className="size-3" /> : <PanelRightOpen className="size-3" />}
                {pdfOpen ? "Hide PDF" : "Show PDF"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {mode === "preview" ? (
            <div className="prose-note px-6 py-5">{preview}</div>
          ) : editMode === "rich" ? (
            <MilkdownEditor key={editorKey} initial={userPortion} onChange={setUserPortion} />
          ) : (
            <textarea
              value={userPortion}
              onChange={(e) => setUserPortion(e.target.value)}
              spellCheck={false}
              className="size-full min-h-[60vh] resize-none bg-transparent px-6 py-4 font-mono text-sm leading-6 outline-none placeholder:text-[var(--color-muted-2)]"
              placeholder="Markdown source. Switch to Rich to format visually."
            />
          )}
        </div>

        {initialSplit.preserved && mode === "edit" && (
          <div className="border-t border-[var(--color-border)] px-3 py-2 text-[10px] text-[var(--color-muted-2)]">
            Auto-extracted source-text block ({initialSplit.preserved.length.toLocaleString()} chars) is hidden from the editor and preserved verbatim on save.
          </div>
        )}
      </div>

      {/* RHS — PDF viewer */}
      {pdfUrl && pdfOpen && (
        <div className="flex min-h-[70vh] flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2 text-xs">
            <span className="truncate font-mono text-[var(--color-muted)]" title={pdfFilename}>{pdfFilename}</span>
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] hover:underline">
              Open in tab ↗
            </a>
          </div>
          <iframe
            src={pdfUrl}
            title={pdfFilename ?? "Source PDF"}
            className="flex-1 w-full rounded-b-lg bg-white"
          />
        </div>
      )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Eye; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 transition-colors",
        active ? "bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
      )}
    >
      <Icon className="size-3.5" /> {children}
    </button>
  );
}

function SaveStatus({ state, pending, dirty }: { state: SaveState; pending: boolean; dirty: boolean }) {
  if (pending || state.status === "saving") return <span className="inline-flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> saving…</span>;
  if (state.status === "error") return <span className="inline-flex items-center gap-1 text-[var(--color-danger)]"><AlertCircle className="size-3" /> {state.message}</span>;
  if (state.status === "saved") return <span className="inline-flex items-center gap-1 text-[var(--color-success)]"><Check className="size-3" /> saved</span>;
  if (dirty) return <span className="text-[var(--color-warning)]">unsaved</span>;
  return null;
}
