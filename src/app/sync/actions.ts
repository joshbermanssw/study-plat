"use server";

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { canvasGet, canvasDownload, CanvasError } from "@/lib/canvas-fetch";
import type { CanvasFileDetail } from "@/lib/canvas-fetch";
import { extractText } from "@/lib/extract-text";
import { stampExtract } from "@/lib/stamp-extract";

const CONTENT_ROOT = path.join(process.cwd(), "content", "units");
const SOURCES_ROOT = path.join(process.cwd(), "data", "sources");

export interface ItemRef { unit: string; slug: string; }
export interface ItemResult {
  unit: string;
  slug: string;
  ok: boolean;
  localFile?: string;
  filename?: string;
  size?: number;
  extractedChars?: number;
  extractedPages?: number;
  message?: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\/\\?<>:|*"]+/g, "_").replace(/\s+/g, "_");
}

function stubPathFor(unit: string, slug: string): string {
  return path.join(CONTENT_ROOT, unit, `${slug}.mdx`);
}

async function readStub(unit: string, slug: string) {
  const p = stubPathFor(unit, slug);
  const raw = await fs.readFile(p, "utf8");
  return { path: p, raw, parsed: matter(raw) };
}

async function extractAndStamp(absLocalFile: string, parsed: matter.GrayMatterFile<string>): Promise<{ chars: number; pages?: number; body: string }> {
  const ext = await extractText(absLocalFile);
  const pageLabel = ext.pages != null ? ` · ${ext.pages} pages` : "";
  const truncLabel = ext.truncated ? " · truncated" : "";
  const summary = `Source text (auto-extracted${pageLabel}${truncLabel})`;
  const newBody = stampExtract(parsed.content, ext.text, summary);
  return { chars: ext.text.length, pages: ext.pages, body: newBody };
}

async function downloadOne(req: ItemRef): Promise<ItemResult> {
  const { unit, slug } = req;
  let stub;
  try { stub = await readStub(unit, slug); }
  catch { return { unit, slug, ok: false, message: "Stub not found" }; }

  const fm = stub.parsed.data as Record<string, unknown>;
  const fileId = typeof fm.canvasFileId === "number" ? fm.canvasFileId : undefined;
  if (!fileId) return { unit, slug, ok: false, message: "No canvasFileId — re-run `pnpm sync`" };

  try {
    const file = await canvasGet<CanvasFileDetail>(`/files/${fileId}`);
    const bytes = await canvasDownload(file.url);

    const filename = sanitizeFilename(file.display_name || file.filename || `${slug}.bin`);
    const destDir = path.join(SOURCES_ROOT, unit);
    await fs.mkdir(destDir, { recursive: true });
    const destAbs = path.join(destDir, filename);
    await fs.writeFile(destAbs, Buffer.from(bytes));
    const destRel = path.relative(process.cwd(), destAbs);

    // Extract text + stamp into stub body. Extraction failures are non-fatal.
    let extractedChars: number | undefined;
    let extractedPages: number | undefined;
    let body = stub.parsed.content;
    try {
      const x = await extractAndStamp(destAbs, stub.parsed);
      extractedChars = x.chars;
      extractedPages = x.pages;
      body = x.body;
    } catch (e) {
      console.warn(`Extract failed for ${slug}:`, (e as Error).message);
    }

    const updated = matter.stringify(body, {
      ...fm,
      localFile: destRel,
      fetchedAt: new Date(),    // YAML serializer (js-yaml) emits ISO-8601 timestamp
      fileSize: file.size,
      fileContentType: file["content-type"],
      // Promote stub → synced once we have local content + extracted text. Do
      // not touch draft/done — user prose is more authoritative than sync state.
      status: fm.status === "stub" ? "synced" : fm.status,
    });
    await fs.writeFile(stub.path, updated, "utf8");

    return { unit, slug, ok: true, localFile: destRel, filename, size: file.size, extractedChars, extractedPages };
  } catch (e) {
    const status = e instanceof CanvasError ? e.status : 0;
    return { unit, slug, ok: false, message: `${status || ""} ${(e as Error).message}`.trim() };
  }
}

async function reExtractOne(req: ItemRef): Promise<ItemResult> {
  const { unit, slug } = req;
  let stub;
  try { stub = await readStub(unit, slug); }
  catch { return { unit, slug, ok: false, message: "Stub not found" }; }

  const fm = stub.parsed.data as Record<string, unknown>;
  const localFile = typeof fm.localFile === "string" ? fm.localFile : undefined;
  if (!localFile) return { unit, slug, ok: false, message: "No localFile on stub" };

  const absLocalFile = path.resolve(process.cwd(), localFile);
  try {
    const x = await extractAndStamp(absLocalFile, stub.parsed);
    const updated = matter.stringify(x.body, {
      ...fm,
      status: fm.status === "stub" ? "synced" : fm.status,
    });
    await fs.writeFile(stub.path, updated, "utf8");
    return { unit, slug, ok: true, localFile, extractedChars: x.chars, extractedPages: x.pages };
  } catch (e) {
    return { unit, slug, ok: false, message: (e as Error).message };
  }
}

export async function downloadCanvasItems(items: ItemRef[]): Promise<ItemResult[]> {
  const results: ItemResult[] = [];
  for (const req of items) results.push(await downloadOne(req));
  try {
    revalidatePath("/sync");
    for (const r of results) if (r.ok) revalidatePath(`/${r.unit}/${r.slug}`);
  } catch { /* outside Next request */ }
  return results;
}

export async function reExtractItems(items: ItemRef[]): Promise<ItemResult[]> {
  const results: ItemResult[] = [];
  for (const req of items) results.push(await reExtractOne(req));
  try {
    revalidatePath("/sync");
    for (const r of results) if (r.ok) revalidatePath(`/${r.unit}/${r.slug}`);
  } catch { /* outside Next request */ }
  return results;
}

/** Save edited MDX body back to disk, preserving frontmatter. Auto-promotes stub → draft on first save. */
export async function saveNoteBody(unit: string, slug: string, body: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const stub = await readStub(unit, slug);
    const fm = { ...(stub.parsed.data as Record<string, unknown>) };
    if (fm.status === "stub") fm.status = "draft";
    fm.editedAt = new Date();
    await fs.writeFile(stub.path, matter.stringify(body, fm), "utf8");
    try { revalidatePath(`/${unit}/${slug}`); } catch {}
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** Re-export for legacy aliases used by older callers. */
export type DownloadRequest = ItemRef;
export type DownloadResult = ItemResult;

// ─────────────────────────────── manual uploads ───────────────────────────────

export interface UploadResult {
  ok: boolean;
  unit?: string;
  slug?: string;
  href?: string;
  filename?: string;
  size?: number;
  extractedChars?: number;
  extractedPages?: number;
  message?: string;
}

function sanitizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")              // strip extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

function noteTypeFromName(name: string): "lecture" | "lab" | "tutorial" | "reading" {
  const t = name.toLowerCase();
  if (/(lec|lecture|week\s*\d|slides)/.test(t)) return "lecture";
  if (/(lab|practical)/.test(t))                return "lab";
  if (/(tut|tutorial|workshop)/.test(t))         return "tutorial";
  return "reading";
}

/** Append `-2`, `-3` ... if a slug already exists in the week dir. */
async function uniqueSlug(baseDir: string, slug: string): Promise<string> {
  let n = 1;
  let candidate = slug;
  while (true) {
    try {
      await fs.access(path.join(baseDir, `${candidate}.mdx`));
      n += 1;
      candidate = `${slug}-${n}`;
    } catch {
      return candidate;
    }
  }
}

export async function uploadManualFile(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  const unit = String(formData.get("unit") ?? "").toUpperCase();
  const weekRaw = formData.get("week");
  const week = Number(weekRaw);
  const typeRaw = String(formData.get("type") ?? "");
  const titleOverride = String(formData.get("title") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "No file" };
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) return { ok: false, message: "Only PDF files are accepted" };
  if (!unit) return { ok: false, message: "Unit required" };
  if (!Number.isFinite(week) || week < 0 || week > 99) return { ok: false, message: "Week must be 0-99" };
  const validTypes = ["lecture", "lab", "tutorial", "reading"] as const;
  const type = (validTypes as readonly string[]).includes(typeRaw)
    ? (typeRaw as (typeof validTypes)[number])
    : noteTypeFromName(file.name);

  const originalName = file.name;
  const filename = sanitizeFilename(originalName);
  const weekDir  = `week-${String(week).padStart(2, "0")}`;
  const destDir  = path.join(SOURCES_ROOT, unit);
  const stubDir  = path.join(CONTENT_ROOT, unit, weekDir);

  await fs.mkdir(destDir, { recursive: true });
  await fs.mkdir(stubDir, { recursive: true });

  const destAbs = path.join(destDir, filename);
  await fs.writeFile(destAbs, Buffer.from(await file.arrayBuffer()));
  const destRel = path.relative(process.cwd(), destAbs);

  // Build the stub
  const baseSlug = sanitizeSlug(titleOverride || originalName);
  const slugSegment = await uniqueSlug(stubDir, baseSlug);
  const slug = `${weekDir}/${slugSegment}`;
  const stubAbs = path.join(stubDir, `${slugSegment}.mdx`);

  // Try extraction (PDF/DOCX/TXT) — fall back to empty body if unsupported.
  let extractedChars: number | undefined;
  let extractedPages: number | undefined;
  let body = `> Manually uploaded ${originalName}. Edit this note any time.\n`;
  try {
    const x = await extractText(destAbs);
    const summary = `Source text (auto-extracted${x.pages != null ? ` · ${x.pages} pages` : ""}${x.truncated ? " · truncated" : ""})`;
    body = stampExtract(body, x.text, summary);
    extractedChars = x.text.length;
    extractedPages = x.pages;
  } catch (e) {
    body += `\n*Text extraction failed: ${(e as Error).message}*\n`;
  }

  const title = titleOverride || originalName.replace(/\.[^.]+$/, "");
  const mdx = matter.stringify(body, {
    title,
    unit,
    week,
    type,
    status: "synced",
    sourceFile: originalName,
    module: "Manual upload",
    localFile: destRel,
    fetchedAt: new Date(),
    fileSize: file.size,
    fileContentType: file.type || "application/octet-stream",
  });
  await fs.writeFile(stubAbs, mdx, "utf8");

  try {
    revalidatePath(`/${unit}`);
    revalidatePath("/sync");
  } catch {}

  return {
    ok: true,
    unit,
    slug,
    href: `/${unit}/${slug}`,
    filename,
    size: file.size,
    extractedChars,
    extractedPages,
  };
}
