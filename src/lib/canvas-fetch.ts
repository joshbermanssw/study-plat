/**
 * Canvas REST helpers, shared between the sync script and server actions.
 * Reads CANVAS_HOST + CANVAS_TOKEN from process.env (loaded via dotenv in
 * scripts, or from .env.local at runtime in Next).
 */

const HOST = () => process.env.CANVAS_HOST ?? "canvas.sydney.edu.au";
const TOKEN = () => process.env.CANVAS_TOKEN;

export class CanvasError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function ensureToken(): string {
  const t = TOKEN();
  if (!t) throw new CanvasError(0, "Missing CANVAS_TOKEN in environment (.env.local)");
  return t;
}

export function canvasOrigin(): string {
  return `https://${HOST()}`;
}

function buildUrl(pathname: string, params: Record<string, string | number> = {}): string {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  );
  const sep = pathname.includes("?") ? "&" : "?";
  const tail = qs.toString();
  return `${canvasOrigin()}/api/v1${pathname}${tail ? sep + tail : ""}`;
}

export async function canvasGet<T>(pathname: string, params: Record<string, string | number> = {}): Promise<T> {
  const token = ensureToken();
  const res = await fetch(buildUrl(pathname, params), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new CanvasError(res.status, `Canvas ${res.status} ${res.statusText} → ${pathname}`);
  return (await res.json()) as T;
}

export async function canvasGetList<T>(pathname: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const token = ensureToken();
  let url: string | null = buildUrl(pathname, { per_page: 100, ...params });
  const out: T[] = [];
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new CanvasError(res.status, `Canvas ${res.status} ${res.statusText} → ${url}`);
    const body = (await res.json()) as T | T[];
    if (Array.isArray(body)) out.push(...body); else out.push(body);
    url = parseNextLink(res.headers.get("link"));
  }
  return out;
}

export async function canvasDownload(url: string): Promise<ArrayBuffer> {
  const token = ensureToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new CanvasError(res.status, `Canvas download ${res.status} → ${url}`);
  return await res.arrayBuffer();
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",").map((s) => s.trim())) {
    const m = part.match(/^<([^>]+)>;\s*rel="next"$/);
    if (m) return m[1];
  }
  return null;
}

// ─── Canvas resource shapes (partial — only what we use) ───

export interface CanvasModuleItemDetail {
  id: number;
  title: string;
  type: string;          // "File" | "Page" | "Assignment" | ...
  content_id?: number;   // present for File / Assignment / Quiz
  html_url?: string;
  url?: string;
}

export interface CanvasFileDetail {
  id: number;
  display_name: string;
  filename: string;
  url: string;           // signed download URL
  "content-type": string;
  size: number;
}
