"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Fuse from "fuse.js";
import Link from "next/link";
import type { Note } from "@/lib/types";

type Indexed = Note & { unitName: string };

export function CmdK({ index }: { index: Indexed[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const fuse = useMemo(
    () => new Fuse(index, { keys: ["title", "unit", "unitName", "body"], threshold: 0.35, ignoreLocation: true }),
    [index]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => (q ? fuse.search(q).slice(0, 20).map((r) => r.item) : index.slice(0, 12)), [q, fuse, index]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <Search className="size-3.5" /> Search…
        <kbd className="ml-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1 font-mono text-[10px]">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[10vh]" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
              <Search className="size-4 text-[var(--color-muted)]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notes…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-2)]"
              />
              <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1 font-mono text-[10px] text-[var(--color-muted)]">esc</kbd>
            </div>
            <ul className="max-h-96 overflow-y-auto py-1">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">No matches</li>
              )}
              {results.map((n) => (
                <li key={`${n.unit}/${n.slug}`}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{n.title}</div>
                      <div className="truncate text-xs text-[var(--color-muted)]">{n.unit} · {n.unitName}</div>
                    </div>
                    {n.status === "stub" && <span className="font-mono text-[10px] text-[var(--color-muted-2)]">stub</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
