import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";

const SOURCES_ROOT = path.resolve(process.cwd(), "data", "sources");

const MIME: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc":  "application/msword",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt":  "application/vnd.ms-powerpoint",
  ".txt":  "text/plain; charset=utf-8",
  ".md":   "text/markdown; charset=utf-8",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  const rel = parts.map((p) => decodeURIComponent(p)).join("/");
  const abs = path.resolve(SOURCES_ROOT, rel);

  // Path-traversal guard: must remain inside SOURCES_ROOT.
  if (!abs.startsWith(SOURCES_ROOT + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }

  let stat;
  try { stat = statSync(abs); } catch { return new Response("Not found", { status: 404 }); }
  if (!stat.isFile()) return new Response("Not found", { status: 404 });

  const ext = path.extname(abs).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream;

  return new Response(stream, {
    headers: {
      "content-type": contentType,
      "content-length": String(stat.size),
      "cache-control": "private, max-age=300",
      "content-disposition": `inline; filename="${path.basename(abs)}"`,
    },
  });
}
