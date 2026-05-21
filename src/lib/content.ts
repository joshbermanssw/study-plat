import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Note, NoteFrontmatter, UnitData, WeekGroup } from "./types";
import { UNITS, getUnit } from "./units";
import { toDate } from "./dates";
import { WEEKLY_TOPICS } from "./weekly-topics";

const CONTENT_ROOT = path.join(process.cwd(), "content", "units");

function safeReadDir(dir: string): string[] {
  try { return fs.readdirSync(dir); } catch { return []; }
}

function walkMdx(dir: string, base = ""): { rel: string; abs: string }[] {
  const out: { rel: string; abs: string }[] = [];
  for (const entry of safeReadDir(dir)) {
    const abs = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) out.push(...walkMdx(abs, rel));
    else if (entry.endsWith(".mdx") || entry.endsWith(".md")) {
      // Skip reserved underscore files except the two we know how to handle:
      //   _unit.mdx  — unit overview (handled separately)
      //   _teach.mdx — synthesised into an "AI OVERVIEW" pseudo-note per week
      if (entry.startsWith("_") && entry !== "_unit.mdx" && entry !== "_unit.md" &&
          entry !== "_teach.mdx" && entry !== "_teach.md") continue;
      out.push({ rel, abs });
    }
  }
  return out;
}

function parseNote(unit: string, rel: string, raw: string): Note {
  const { data, content } = matter(raw);
  // gray-matter may hand back Date objects (js-yaml CORE schema recognises
  // ISO-8601 timestamps) or plain strings — toDate() handles both.
  const fm = data as Record<string, unknown>;
  const slug = rel.replace(/\.mdx?$/, "");

  // Synthesise the "AI OVERVIEW" pseudo-note from a _teach.mdx file.
  if (slug.endsWith("/_teach")) {
    const weekMatch = slug.match(/week-(\d+)/);
    const week = weekMatch ? Number(weekMatch[1]) : undefined;
    return {
      title: typeof fm.title === "string" ? fm.title.replace(/^Week\s*\d+\s*[—-]\s*/i, "") : "AI Overview",
      unit,
      week,
      type: "ai-overview",
      status: "done",
      order: -1,         // pin to the top of the week's note list
      slug,
      href: week != null ? `/${unit}/study/${week}` : `/${unit}`,
      body: content,
    };
  }

  return {
    title: typeof fm.title === "string" ? fm.title : slug,
    unit,
    week: typeof fm.week === "number" ? fm.week : undefined,
    type: (fm.type as Note["type"]) ?? "reading",
    status: (fm.status as Note["status"]) ?? "stub",
    sourceFile: typeof fm.sourceFile === "string" ? fm.sourceFile : undefined,
    examWeight: fm.examWeight as Note["examWeight"],
    order: typeof fm.order === "number" ? fm.order : undefined,
    canvasUrl: typeof fm.canvasUrl === "string" ? fm.canvasUrl : undefined,
    canvasFileId: typeof fm.canvasFileId === "number" ? fm.canvasFileId : undefined,
    canvasItemType: typeof fm.canvasItemType === "string" ? fm.canvasItemType : undefined,
    module: typeof fm.module === "string" ? fm.module : undefined,
    localFile: typeof fm.localFile === "string" ? fm.localFile : undefined,
    fetchedAt: toDate(fm.fetchedAt),
    editedAt: toDate(fm.editedAt),
    fileSize: typeof fm.fileSize === "number" ? fm.fileSize : undefined,
    fileContentType: typeof fm.fileContentType === "string" ? fm.fileContentType : undefined,
    slug,
    href: `/${unit}/${slug}`,
    body: content,
  };
}

function weekNumberFromSlug(slug: string): number | undefined {
  const m = slug.match(/week-(\d{1,2})/i);
  return m ? Number(m[1]) : undefined;
}

export function getAllUnits(): UnitData[] {
  return UNITS.map((u) => getUnitData(u.code)).filter(Boolean) as UnitData[];
}

export function getUnitData(unitCode: string): UnitData | undefined {
  const meta = getUnit(unitCode);
  if (!meta) return undefined;
  const unitDir = path.join(CONTENT_ROOT, meta.code);
  const files = walkMdx(unitDir);

  const allNotes: Note[] = files.map(({ rel, abs }) =>
    parseNote(meta.code, rel, fs.readFileSync(abs, "utf8"))
  );

  let overview: Note | undefined;
  const examNotes: Note[] = [];
  const byWeek = new Map<number, Note[]>();

  for (const n of allNotes) {
    if (n.slug === "_unit") { overview = n; continue; }
    if (n.slug.startsWith("exam/")) { examNotes.push(n); continue; }
    const wk = n.week ?? weekNumberFromSlug(n.slug);
    if (wk == null) continue;
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk)!.push(n);
  }

  const topics = WEEKLY_TOPICS[meta.code.toUpperCase()] ?? [];
  // Include every week with topic metadata, plus any extras that have notes.
  const weekNumbers = new Set<number>([...byWeek.keys(), ...topics.map((t) => t.week)]);
  const weeks: WeekGroup[] = [...weekNumbers]
    .sort((a, b) => a - b)
    .map((week) => {
      const topicEntry = topics.find((t) => t.week === week);
      const notes = (byWeek.get(week) ?? []).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.slug.localeCompare(b.slug),
      );
      return {
        week,
        topic: topicEntry?.topic,
        summary: topicEntry?.summary,
        notes,
      };
    });

  return { ...meta, weeks, exam: examNotes, overview, allNotes };
}

export function getNote(unitCode: string, slugParts: string[]): Note | undefined {
  const data = getUnitData(unitCode);
  if (!data) return undefined;
  const slug = slugParts.join("/");
  return data.allNotes.find((n) => n.slug === slug);
}

export function flattenNotesForSearch(): Array<Note & { unitName: string }> {
  const out: Array<Note & { unitName: string }> = [];
  for (const u of getAllUnits()) {
    for (const n of u.allNotes) out.push({ ...n, unitName: u.name });
  }
  return out;
}
