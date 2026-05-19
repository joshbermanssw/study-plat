/**
 * One-shot migration: walk every stub in /content, and if it has a localFile
 * but status is still "stub", promote to "synced". Body untouched.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_ROOT = path.join(process.cwd(), "content", "units");

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (fs.statSync(abs).isDirectory()) out.push(...walk(abs));
    else if (entry.endsWith(".mdx")) out.push(abs);
  }
  return out;
}

let promoted = 0;
let kept = 0;
for (const unit of fs.readdirSync(CONTENT_ROOT)) {
  const unitDir = path.join(CONTENT_ROOT, unit);
  if (!fs.statSync(unitDir).isDirectory()) continue;
  for (const abs of walk(unitDir)) {
    const parsed = matter(fs.readFileSync(abs, "utf8"));
    const fm = parsed.data as Record<string, unknown>;
    const hasLocal = typeof fm.localFile === "string";
    if (hasLocal && fm.status === "stub") {
      fm.status = "synced";
      fs.writeFileSync(abs, matter.stringify(parsed.content, fm), "utf8");
      promoted++;
      console.log(`  promoted ${path.relative(process.cwd(), abs)}`);
    } else {
      kept++;
    }
  }
}
console.log(`\nDone: ${promoted} promoted, ${kept} unchanged.`);
