import fs from "node:fs/promises";
import path from "node:path";

export interface ExtractedText {
  text: string;
  pages?: number;
  truncated: boolean;
}

const MAX_CHARS = 250_000; // ~50 pages of dense slides; protects MDX files from absurd size

export async function extractText(absPath: string): Promise<ExtractedText> {
  const ext = path.extname(absPath).toLowerCase();
  if (ext === ".pdf") return extractPdf(absPath);
  if (ext === ".docx") return extractDocx(absPath);
  if (ext === ".txt" || ext === ".md") {
    const text = await fs.readFile(absPath, "utf8");
    return cap({ text, truncated: false });
  }
  return { text: `[Unsupported file type for text extraction: ${ext}]`, truncated: false };
}

async function extractPdf(absPath: string): Promise<ExtractedText> {
  const { extractText: unpdfExtract, getDocumentProxy } = await import("unpdf");
  const buf = await fs.readFile(absPath);
  const bytes = new Uint8Array(buf);
  const pdf = await getDocumentProxy(bytes);
  const { text, totalPages } = await unpdfExtract(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join("\n\n") : text;
  return cap({ text: merged, pages: totalPages, truncated: false });
}

async function extractDocx(absPath: string): Promise<ExtractedText> {
  const mammoth = await import("mammoth");
  const buf = await fs.readFile(absPath);
  const result = await mammoth.extractRawText({ buffer: buf });
  return cap({ text: result.value, truncated: false });
}

function cap(e: ExtractedText): ExtractedText {
  if (e.text.length <= MAX_CHARS) return e;
  return { ...e, text: e.text.slice(0, MAX_CHARS), truncated: true };
}
