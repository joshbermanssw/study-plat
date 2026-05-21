"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, ClipboardList, FolderTree } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Quiz } from "@/lib/quiz";
import { QuizView } from "./quiz-view";

interface NoteLink { href: string; title: string; type: string }

export function StudyView({
  teachContent,
  quiz,
  notes,
}: {
  teachContent: React.ReactNode | null;
  quiz: Quiz | null;
  notes: NoteLink[];
}) {
  const tabs: { id: "teach" | "quiz" | "notes"; label: string; icon: typeof BookOpen; available: boolean }[] = [
    { id: "teach", label: "Teach me",    icon: BookOpen,        available: !!teachContent },
    { id: "quiz",  label: "Quiz",        icon: ClipboardList,   available: !!quiz },
    { id: "notes", label: `Notes (${notes.length})`, icon: FolderTree, available: notes.length > 0 },
  ];
  const firstAvailable = tabs.find((t) => t.available)?.id ?? "teach";
  const [active, setActive] = useState<"teach" | "quiz" | "notes">(firstAvailable);

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-md bg-[var(--color-surface)] p-1 text-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            disabled={!t.available}
            onClick={() => setActive(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors",
              active === t.id
                ? "bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:hover:text-[var(--color-muted)]",
            )}
          >
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {active === "teach" && (teachContent ?? <Empty>Teaching content not generated for this week yet.</Empty>)}
      {active === "quiz" && (quiz ? <QuizView quiz={quiz} /> : <Empty>Quiz not generated for this week yet.</Empty>)}
      {active === "notes" && (
        <ul className="flex flex-col gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
          {notes.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-[var(--color-surface-2)]">
                <span className="truncate">{n.title}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted-2)]">{n.type}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
      {children}
    </div>
  );
}
