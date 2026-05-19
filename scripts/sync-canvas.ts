/**
 * Canvas sync — pulls course structure from canvas.sydney.edu.au into local
 * /data/course.json + generates note STUBS into /content/units/<CODE>/.
 *
 * Run:
 *   pnpm sync                     # syncs only courses matching src/lib/units.ts
 *   pnpm sync COMP4347 INFO4444   # specific codes (overrides units.ts filter)
 *   pnpm sync --all               # everything Canvas thinks you're enrolled in
 *   pnpm sync --list              # just print active enrollments, don't write
 *   pnpm sync --dry               # show what would be written, write nothing
 *
 * Required env (in .env.local):
 *   CANVAS_HOST=canvas.sydney.edu.au
 *   CANVAS_TOKEN=<personal access token from /profile/settings>
 *
 * Idempotent: existing note files are never overwritten — only NEW stubs are
 * created. Edit notes freely after first sync.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { UNITS } from "../src/lib/units";

const ROOT = process.cwd();
const HOST = process.env.CANVAS_HOST ?? "canvas.sydney.edu.au";
const TOKEN = process.env.CANVAS_TOKEN;
const DRY = process.argv.includes("--dry");
const ALL = process.argv.includes("--all");
const LIST_ONLY = process.argv.includes("--list");
const FILTER_CODES = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"));

if (!TOKEN) {
  console.error("✖ Missing CANVAS_TOKEN. Create one at https://" + HOST + "/profile/settings and put it in .env.local");
  process.exit(1);
}

// ───────────────────────────── Canvas API helpers ─────────────────────────────

interface CanvasCourse { id: number; name: string; course_code: string; term?: { name: string }; }
interface CanvasModule { id: number; name: string; position: number; items_url: string; items?: CanvasModuleItem[]; }
interface CanvasModuleItem { id: number; title: string; type: string; module_id: number; position: number; url?: string; html_url?: string; content_id?: number; external_url?: string; page_url?: string; }
interface CanvasFile { id: number; display_name: string; filename: string; "content-type": string; url: string; size: number; created_at: string; updated_at: string; }
interface CanvasAssignment { id: number; name: string; due_at: string | null; description: string; html_url: string; points_possible: number; }
interface CanvasCalendarEvent { id: number; title: string; start_at: string; end_at: string; type: string; context_code: string; description?: string; }

async function canvas<T>(pathname: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const qs = new URLSearchParams({ per_page: "100", ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const url = `https://${HOST}/api/v1${pathname}?${qs}`;
  return paginated<T>(url);
}

class CanvasError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function paginated<T>(initialUrl: string): Promise<T[]> {
  let url: string | null = initialUrl;
  const out: T[] = [];
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new CanvasError(res.status, `Canvas ${res.status} ${res.statusText} → ${url}`);
    const body = (await res.json()) as T | T[];
    if (Array.isArray(body)) out.push(...body); else out.push(body);
    url = parseNextLink(res.headers.get("link"));
  }
  return out;
}

async function tryFetch<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof CanvasError && e.status === 403) {
      console.log(`    (skipped ${label}: 403 forbidden — Canvas role can't read this endpoint)`);
      return [];
    }
    if (e instanceof CanvasError && e.status === 404) {
      console.log(`    (skipped ${label}: 404 not found)`);
      return [];
    }
    console.log(`    (skipped ${label}: ${(e as Error).message})`);
    return [];
  }
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",").map((s) => s.trim());
  for (const p of parts) {
    const m = p.match(/^<([^>]+)>;\s*rel="next"$/);
    if (m) return m[1];
  }
  return null;
}

// ─────────────────────────────── helpers ───────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function noteTypeFromTitle(title: string): "lecture" | "lab" | "tutorial" | "reading" {
  const t = title.toLowerCase();
  if (/(lecture|lec\b|week\s*\d)/.test(t)) return "lecture";
  if (/(lab\b|practical)/.test(t)) return "lab";
  if (/(tutorial|tut\b|workshop)/.test(t)) return "tutorial";
  return "reading";
}

function weekFromContext(moduleName: string, title: string): number | undefined {
  const haystack = `${moduleName} ${title}`;
  const m = haystack.match(/week\s*(\d{1,2})/i) ?? haystack.match(/\bw(\d{1,2})\b/i);
  return m ? Number(m[1]) : undefined;
}

function unitCodeFromCourse(c: CanvasCourse): string {
  // USyd codes look like "COMP4347" buried in course_code "COMP4347-S1C-NE-CC-2026"
  const m = c.course_code.match(/[A-Z]{3,4}\d{4}/);
  return m ? m[0] : c.course_code.split("-")[0] ?? c.course_code;
}

function writeIfMissing(filePath: string, contents: string): "created" | "skipped" {
  if (fs.existsSync(filePath)) return "skipped";
  if (DRY) { console.log(`  would write ${path.relative(ROOT, filePath)}`); return "created"; }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
  return "created";
}

/**
 * Merge Canvas-owned frontmatter fields into an existing stub, preserving the
 * body and any user-set fields. Returns true if the file changed.
 */
function upsertCanvasFields(filePath: string, canvasFields: Record<string, unknown>): boolean {
  if (!fs.existsSync(filePath)) return false;
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const fmBefore = JSON.stringify(parsed.data);
  const merged = { ...parsed.data, ...canvasFields };
  const fmAfter = JSON.stringify(merged);
  if (fmBefore === fmAfter) return false;
  if (DRY) { console.log(`  would update ${path.relative(ROOT, filePath)}`); return true; }
  fs.writeFileSync(filePath, matter.stringify(parsed.content, merged), "utf8");
  return true;
}

function writeAlways(filePath: string, contents: string) {
  if (DRY) { console.log(`  would write ${path.relative(ROOT, filePath)}`); return; }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

// ─────────────────────────────── main ───────────────────────────────

interface UnitSyncResult {
  code: string;
  name: string;
  canvasCourseId: number;
  examDate?: string;
  modules: Array<{
    name: string;
    items: Array<{ title: string; type: string; url?: string; week?: number }>;
  }>;
  files: Array<{ id: number; name: string; size: number; url: string }>;
  assignments: Array<{ name: string; dueAt: string | null; url: string }>;
}

async function syncUnit(course: CanvasCourse): Promise<UnitSyncResult> {
  const code = unitCodeFromCourse(course);
  console.log(`\n→ ${code}  ${course.name}  (course ${course.id})`);

  const modules     = await tryFetch("modules",     () => canvas<CanvasModule>(`/courses/${course.id}/modules`, { "include[]": "items" }));
  const files       = await tryFetch("files",       () => canvas<CanvasFile>(`/courses/${course.id}/files`));
  const assignments = await tryFetch("assignments", () => canvas<CanvasAssignment>(`/courses/${course.id}/assignments`));

  let examDate: string | undefined;
  const events = await tryFetch("calendar_events", () => canvas<CanvasCalendarEvent>(`/calendar_events`, {
    "context_codes[]": `course_${course.id}`,
    type: "event",
    start_date: "2026-01-01",
    end_date: "2027-12-31",
  }));
  const exam = events.find((e) => /exam/i.test(e.title));
  if (exam) examDate = exam.start_at;
  if (!examDate) {
    const examAssn = assignments.find((a) => a.due_at && /(final|exam)/i.test(a.name));
    if (examAssn?.due_at) examDate = examAssn.due_at;
  }
  console.log(`    modules: ${modules.length}, files: ${files.length}, assignments: ${assignments.length}${examDate ? `, exam: ${examDate.slice(0, 10)}` : ""}`);

  // Generate stub notes. If a module doesn't have a recognisable week number,
  // fall back to its position so we preserve order and grouping.
  let created = 0, kept = 0, updated = 0;
  for (const mod of modules) {
    const moduleWeek = weekFromContext(mod.name, "");
    const realItems = (mod.items ?? []).filter((i) => i.type !== "SubHeader" && i.type !== "ExternalUrl");
    for (const item of realItems) {
      const itemWeek = weekFromContext(mod.name, item.title);
      const wk = itemWeek ?? moduleWeek ?? mod.position;
      const type = noteTypeFromTitle(item.title);
      const weekDir = `week-${String(wk).padStart(2, "0")}`;
      const filePath = path.join(ROOT, "content", "units", code, weekDir, `${slugify(item.title)}.mdx`);

      const canvasFields: Record<string, unknown> = {
        canvasUrl: item.html_url ?? item.external_url ?? "",
        canvasItemType: item.type,
        module: mod.name,
      };
      if (typeof item.content_id === "number") canvasFields.canvasFileId = item.content_id;

      if (fs.existsSync(filePath)) {
        if (upsertCanvasFields(filePath, canvasFields)) updated++; else kept++;
        continue;
      }

      const fm = [
        "---",
        `title: ${JSON.stringify(item.title)}`,
        `unit: ${code}`,
        `week: ${wk}`,
        `type: ${type}`,
        `status: stub`,
        `sourceFile: ${JSON.stringify(item.title)}`,
        `canvasUrl: ${JSON.stringify(canvasFields.canvasUrl)}`,
        `canvasItemType: ${JSON.stringify(item.type)}`,
        canvasFields.canvasFileId != null ? `canvasFileId: ${canvasFields.canvasFileId}` : "",
        `module: ${JSON.stringify(mod.name)}`,
        "---",
        "",
        `> **${mod.name}** — stub generated from Canvas. Ask Claude to flesh this out in a Note Session.`,
        "",
        item.html_url ? `[Open in Canvas](${item.html_url})` : "",
        "",
      ].filter(Boolean).join("\n");
      const res = writeIfMissing(filePath, fm);
      if (res === "created") created++; else kept++;
    }
  }
  console.log(`    stubs: ${created} created, ${updated} updated, ${kept} kept`);

  // Ensure _unit.mdx exists
  const unitMdxPath = path.join(ROOT, "content", "units", code, "_unit.mdx");
  writeIfMissing(
    unitMdxPath,
    [
      "---",
      `title: ${JSON.stringify(course.name)}`,
      `unit: ${code}`,
      `type: overview`,
      `status: stub`,
      "---",
      "",
      "## Overview",
      "",
      `Unit overview for **${course.name}** — fill this in or ask Claude to summarise from the syllabus.`,
      "",
    ].join("\n"),
  );

  return {
    code,
    name: course.name,
    canvasCourseId: course.id,
    examDate,
    modules: modules.map((m) => ({
      name: m.name,
      items: (m.items ?? []).map((i) => ({
        title: i.title,
        type: i.type,
        url: i.html_url,
        week: weekFromContext(m.name, i.title),
      })),
    })),
    files: files.map((f) => ({ id: f.id, name: f.display_name, size: f.size, url: f.url })),
    assignments: assignments.map((a) => ({ name: a.name, dueAt: a.due_at, url: a.html_url })),
  };
}

/** Filter to academic units. Skip portals, welcome-week, support sites. */
function isAcademicCode(code: string): boolean {
  // Real USyd unit codes look like 3-4 letters + 4 digits, e.g. COMP4347, BUSS2000.
  return /^[A-Z]{3,4}\d{4}$/.test(code);
}

async function main() {
  console.log(`Canvas sync · host=${HOST}${DRY ? " · DRY RUN" : ""}`);
  const courses = await canvas<CanvasCourse>(`/courses`, { enrollment_state: "active" });

  const wantedCodes = FILTER_CODES.length > 0
    ? FILTER_CODES.map((c) => c.toUpperCase())
    : ALL
      ? null // signal: take all academic
      : UNITS.map((u) => u.code.toUpperCase());

  if (LIST_ONLY) {
    console.log("\nActive enrollments:");
    for (const c of courses) {
      const code = unitCodeFromCourse(c);
      const tag = isAcademicCode(code) ? "  " : "· ";
      console.log(`  ${tag}${code.padEnd(10)}  ${c.name}  (id ${c.id})`);
    }
    return;
  }

  const selected = courses.filter((c) => {
    const code = unitCodeFromCourse(c);
    if (!isAcademicCode(code)) return false;
    if (wantedCodes === null) return true; // --all
    return wantedCodes.includes(code.toUpperCase());
  });

  if (selected.length === 0) {
    console.log("\nNo matching academic courses.");
    console.log(`Looking for: ${wantedCodes ? wantedCodes.join(", ") : "(any academic)"}`);
    console.log("Active enrollments (academic only):");
    for (const c of courses) {
      const code = unitCodeFromCourse(c);
      if (isAcademicCode(code)) console.log(`  ${code.padEnd(10)}  ${c.name}`);
    }
    console.log("\nFix: either edit src/lib/units.ts to match these codes, or run `pnpm sync <CODE1> <CODE2>`.");
    return;
  }

  console.log(`Matched ${selected.length} of ${wantedCodes?.length ?? "all"} requested units.`);

  if (wantedCodes && wantedCodes.length > 0) {
    const found = selected.map((c) => unitCodeFromCourse(c).toUpperCase());
    const missing = wantedCodes.filter((c) => !found.includes(c));
    if (missing.length) console.log(`Not found in Canvas: ${missing.join(", ")}`);
  }

  const results: UnitSyncResult[] = [];
  for (const course of selected) {
    try { results.push(await syncUnit(course)); }
    catch (e) { console.error(`  ✖ ${unitCodeFromCourse(course)}: ${(e as Error).message}`); }
  }

  const payload = {
    syncedAt: new Date().toISOString(),
    host: HOST,
    units: results,
  };
  writeAlways(path.join(ROOT, "data", "course.json"), JSON.stringify(payload, null, 2));
  console.log(`\n✓ Wrote data/course.json (${results.length} units)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
