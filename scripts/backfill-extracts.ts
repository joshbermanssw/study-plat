import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { reExtractItems } from "../src/app/sync/actions";

const CONTENT_ROOT = path.join(process.cwd(), "content", "units");

function walk(dir: string, base = ""): { unit: string; slug: string; abs: string }[] {
  const out: { unit: string; slug: string; abs: string }[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (fs.statSync(abs).isDirectory()) {
      out.push(...walk(abs, base ? `${base}/${entry}` : entry));
    } else if (entry.endsWith(".mdx")) {
      const rel = base ? `${base}/${entry}` : entry;
      const slug = rel.replace(/\.mdx$/, "");
      out.push({ unit: "", slug, abs });
    }
  }
  return out;
}

async function main() {
  const targets: { unit: string; slug: string }[] = [];
  for (const unit of fs.readdirSync(CONTENT_ROOT)) {
    const unitDir = path.join(CONTENT_ROOT, unit);
    if (!fs.statSync(unitDir).isDirectory()) continue;
    for (const { slug, abs } of walk(unitDir)) {
      const fm = matter(fs.readFileSync(abs, "utf8"));
      const hasLocal = typeof fm.data.localFile === "string";
      const hasNewExtract = fm.content.includes("{/* canvas-extract-start */}");
      // also re-stamp any old HTML-comment style from previous runs
      const hasOldExtract = fm.content.includes("<!-- canvas-extract-start -->");
      if (hasLocal && (!hasNewExtract || hasOldExtract)) targets.push({ unit, slug });
    }
  }
  if (targets.length === 0) { console.log("nothing to backfill"); return; }
  console.log(`Backfilling ${targets.length} stubs…`);
  const results = await reExtractItems(targets);
  let ok = 0, fail = 0;
  for (const r of results) {
    if (r.ok) { ok++; console.log(`  ✓ ${r.unit}/${r.slug} — ${r.extractedChars} chars${r.extractedPages ? `, ${r.extractedPages} pp` : ""}`); }
    else      { fail++; console.log(`  ✖ ${r.unit}/${r.slug} — ${r.message}`); }
  }
  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}
main();
