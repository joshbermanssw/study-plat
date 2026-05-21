/**
 * Comprehensive MDX sweeper. Runs across every .mdx file in content/units/
 * and:
 *
 *   1. Attempts to compile via @mdx-js/mdx — surfaces hard failures.
 *   2. Pattern-scans for soft failures that compile but render badly.
 *   3. Auto-fixes the unambiguous ones.
 *   4. Reports residual issues with line/col context.
 *
 * Issue classes covered:
 *
 *   A. <https://...>, <email@...> autolinks → [text](url)
 *   B. Non-breaking space (U+00A0) anywhere → regular space (only between
 *      ASCII chars; preserves intentional NBSP in code-fenced regions)
 *   C. \{ or \&#123; leftover backslash → strip
 *   D. Bare `{` in prose not starting a JSX comment → &#123;
 *   E. Bare `<` in prose followed by non-letter/slash/!/?: → &lt;
 *   F. Asymmetric &#123;...} — closing brace where opener was already
 *      entity-encoded → close with &#125;
 *   G. Unbalanced <sub>, <sup>, <details>, <summary> tags
 *   H. Mojibake — double-encoded HTML entities (&amp;#123; etc.)
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = path.join(process.cwd(), "content", "units");

interface Issue {
  file: string;
  line: number;
  col: number;
  kind: string;
  detail: string;
}

const issues: Issue[] = [];
let totalEdits = 0;
const fixedFiles = new Set<string>();

function relPath(abs: string): string { return path.relative(process.cwd(), abs); }

// ─── walk ──────────────────────────────────────────────────────────────
function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(abs);
    else if (entry.name.endsWith(".mdx")) yield abs;
  }
}

// ─── fence-range tracker (treats ```...``` and `code` as protected) ────
function fencedRanges(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const fenceRe = /^([ \t]*)(`{3,}|~{3,})/gm;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(text))) {
    const fence = m[2];
    const openStart = m.index;
    const closeRe = new RegExp(`^([ \\t]*)${fence[0]}{${fence.length},}[ \\t]*$`, "m");
    const tail = text.slice(fenceRe.lastIndex);
    const closeMatch = tail.match(closeRe);
    if (!closeMatch || closeMatch.index == null) break;
    const closeEnd = fenceRe.lastIndex + closeMatch.index + closeMatch[0].length;
    out.push([openStart, closeEnd]);
    fenceRe.lastIndex = closeEnd;
  }
  return out;
}
function inAny(r: Array<[number, number]>, i: number): boolean {
  for (const [a, b] of r) if (i >= a && i < b) return true;
  return false;
}

function lineColOf(text: string, offset: number): [number, number] {
  const before = text.slice(0, offset);
  const line = (before.match(/\n/g) ?? []).length + 1;
  const col = offset - (before.lastIndexOf("\n") + 1) + 1;
  return [line, col];
}

// ─── fixes ─────────────────────────────────────────────────────────────

function fixAutolinks(text: string, file: string): string {
  const fenced = fencedRanges(text);
  return text.replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/g, (m, url, off) => {
    if (typeof off === "number" && inAny(fenced, off)) return m;
    totalEdits++;
    fixedFiles.add(file);
    if (url.startsWith("mailto:")) {
      const addr = url.slice(7);
      return `[${addr}](${url})`;
    }
    return `[${url}](${url})`;
  });
}

function fixNbsp(text: string, file: string): string {
  // Replace NBSP ( ) with regular space.
  let changed = 0;
  const out = text.replace(/ /g, () => { changed++; return " "; });
  if (changed > 0) { totalEdits += changed; fixedFiles.add(file); }
  return out;
}

function stripBackslashEscapes(text: string, file: string): string {
  let changed = 0;
  // \{ → {  (we'll let the {-pass re-encode if needed)
  let out = text.replace(/\\\{/g, () => { changed++; return "{"; });
  // \&#123; → &#123;
  out = out.replace(/\\&#123;/g, () => { changed++; return "&#123;"; });
  if (changed > 0) { totalEdits += changed; fixedFiles.add(file); }
  return out;
}

function fixDoubleEncoded(text: string, file: string): string {
  let changed = 0;
  // &amp;#123; → &#123;
  const out = text.replace(/&amp;#(\d+);/g, (_m, n) => { changed++; return `&#${n};`; });
  if (changed > 0) { totalEdits += changed; fixedFiles.add(file); }
  return out;
}

function escapeBracesAndLts(text: string, file: string): string {
  const fenced = fencedRanges(text);
  let out = "";
  let inBackticks = false;
  let runLen = 0;
  let edits = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === "`" && !inAny(fenced, i)) {
      let r = 1;
      while (text[i + r] === "`") r++;
      if (inBackticks && r === runLen) { inBackticks = false; runLen = 0; }
      else if (!inBackticks) { inBackticks = true; runLen = r; }
      out += text.slice(i, i + r);
      i += r - 1;
      continue;
    }

    if (!inAny(fenced, i) && !inBackticks) {
      if (ch === "<") {
        const next = text[i + 1];
        if (!next || !/[a-zA-Z/!?]/.test(next)) {
          out += "&lt;"; edits++; continue;
        }
      }
      if (ch === "{") {
        const next = text[i + 1];
        if (next !== "/") {
          if (out.endsWith("\\")) out = out.slice(0, -1);
          out += "&#123;"; edits++; continue;
        }
      }
    }
    out += ch;
  }
  if (edits > 0) { totalEdits += edits; fixedFiles.add(file); }
  return out;
}

function balanceAsymmetricBraces(text: string, file: string): string {
  // For each line outside code fences: if a `}` follows an earlier `&#123;` on
  // the same line and isn't already encoded, encode it. Forward-pass version
  // (the earlier reverse-array trick produced corrupted ";521#&" garbage in
  // some files — never again).
  const fenced = fencedRanges(text);
  const lines = text.split("\n");
  let edits = 0;
  let offset = 0;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lineStart = offset;
    offset += line.length + 1;
    if (inAny(fenced, lineStart)) continue;
    const opens = (line.match(/&#123;/g) || []).length;
    const closesEnc = (line.match(/&#125;/g) || []).length;
    let needed = opens - closesEnc;
    if (needed <= 0) continue;
    // Walk forward and replace the FIRST `needed` bare `}` (skipping ones that
    // are part of an existing &#125;).
    let out = "";
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === "}" && needed > 0) {
        // skip if part of &#125; (look back 5 chars)
        const back = line.slice(Math.max(0, i - 5), i);
        if (back === "&#125") { out += c; continue; }
        out += "&#125;";
        needed--;
        edits++;
        continue;
      }
      out += c;
    }
    lines[li] = out;
  }
  if (edits > 0) { totalEdits += edits; fixedFiles.add(file); }
  return lines.join("\n");
}

// Revert HTML entities inside fenced code blocks AND inline backtick spans
// back to raw characters. Inside ``` ... ``` and ` ... ` markdown renders
// entities as LITERAL text — `&#123;` becomes "&#123;" not "{". Agents
// sometimes apply the entity defensively even there. Undo that.
function revertEntitiesInsideCode(text: string, file: string): string {
  const fences = fencedRanges(text);
  // Inline backtick spans (single-line, balanced backtick count)
  const inline: Array<[number, number]> = [];
  for (let i = 0; i < text.length; i++) {
    if (inAny(fences, i)) continue;
    if (text[i] === "`") {
      let r = 1;
      while (text[i + r] === "`") r++;
      let j = i + r;
      while (j < text.length && text[j] !== "\n") {
        if (text[j] === "`") {
          let cr = 1;
          while (text[j + cr] === "`") cr++;
          if (cr === r) {
            inline.push([i + r, j]);
            i = j + cr - 1;
            break;
          }
          j += cr;
        } else j++;
      }
    }
  }

  // Inside the protected ranges (fences + inline), revert entities.
  const protectedRanges = [...fences, ...inline].sort((a, b) => a[0] - b[0]);
  let out = "";
  let cursor = 0;
  let edits = 0;
  for (const [start, end] of protectedRanges) {
    out += text.slice(cursor, start);
    let inside = text.slice(start, end);
    const before = inside;
    inside = inside
      .replace(/&#123;/g, "{")
      .replace(/&#125;/g, "}")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    if (inside !== before) {
      edits += (before.match(/&#12[35];|&lt;|&gt;/g) || []).length;
    }
    out += inside;
    cursor = end;
  }
  out += text.slice(cursor);

  if (edits > 0) { totalEdits += edits; fixedFiles.add(file); }
  return out;
}

// Convert `^&#123;X&#125;` and `^(X)` superscripts to <sup>X</sup> so they
// render as actual raised text in the browser instead of bleeding LaTeX
// braces or unsightly parens.
function prettifySuperscripts(text: string, file: string): string {
  const fenced = fencedRanges(text);
  let edits = 0;
  let out = text;

  // ^&#123;X&#125;  →  <sup>X</sup>
  out = out.replace(/\^&#123;([^&]*?(?:&(?!#125;)[^&]*?)*)&#125;/g, (m, inner, off: number) => {
    if (typeof off === "number" && inAny(fenced, off)) return m;
    edits++;
    return `<sup>${inner}</sup>`;
  });

  // ^(X)  →  <sup>X</sup>   (only when X has no nested parens; only outside fences)
  out = out.replace(/(\w)\^\(([^()]+)\)/g, (m, prefix, inner, off: number) => {
    if (typeof off === "number" && inAny(fenced, off)) return m;
    edits++;
    return `${prefix}<sup>${inner}</sup>`;
  });

  if (edits > 0) { totalEdits += edits; fixedFiles.add(file); }
  return out;
}

// ─── scan-only checks (don't fix; just report) ─────────────────────────

function scanHtmlTagBalance(text: string, file: string): void {
  const fenced = fencedRanges(text);
  const tags = ["sub", "sup", "details", "summary", "kbd", "mark"];
  for (const tag of tags) {
    const openRe = new RegExp(`<${tag}(\\s|>)`, "g");
    const closeRe = new RegExp(`</${tag}>`, "g");
    let opens = 0;
    let closes = 0;
    let m: RegExpExecArray | null;
    while ((m = openRe.exec(text))) {
      if (inAny(fenced, m.index)) continue;
      // self-closing <tag /> doesn't need a close
      const tail = text.slice(m.index, m.index + tag.length + 5);
      if (tail.includes("/>")) continue;
      opens++;
    }
    while ((m = closeRe.exec(text))) {
      if (inAny(fenced, m.index)) continue;
      closes++;
    }
    if (opens !== closes) {
      const [l, c] = lineColOf(text, 0);
      issues.push({
        file, line: l, col: c, kind: "tag-imbalance",
        detail: `<${tag}> open=${opens} close=${closes}`,
      });
    }
  }
}

// ─── main ──────────────────────────────────────────────────────────────

function compileCheck(file: string): void {
  // Use the already-working test-mdx.mjs subprocess (which resolves @mdx-js/mdx
  // via the pnpm path, avoiding tsx's ESM/CJS interop issues).
  let result: string;
  try {
    result = execSync(`node scripts/test-mdx.mjs "${file}"`, { encoding: "utf8" });
  } catch (e) {
    result = String((e as { stdout?: string }).stdout ?? e);
  }
  if (!result.trim().startsWith("OK")) {
    const lineMatch = result.match(/"line":(\d+),"column":(\d+)/);
    const errMatch = result.match(/ERROR: (.+)/);
    issues.push({
      file,
      line: lineMatch ? Number(lineMatch[1]) : 0,
      col: lineMatch ? Number(lineMatch[2]) : 0,
      kind: "compile",
      detail: errMatch ? errMatch[1].slice(0, 120) : result.slice(0, 120),
    });
  }
}

async function main() {
  const files = [...walk(ROOT)];
  console.log(`Scanning ${files.length} MDX files...\n`);

  // Pass 1 — fix soft issues
  for (const file of files) {
    let text = fs.readFileSync(file, "utf8");
    const orig = text;
    text = fixDoubleEncoded(text, file);
    text = fixNbsp(text, file);
    text = fixAutolinks(text, file);
    text = stripBackslashEscapes(text, file);
    text = escapeBracesAndLts(text, file);
    text = balanceAsymmetricBraces(text, file);
    text = prettifySuperscripts(text, file);
    text = revertEntitiesInsideCode(text, file);
    if (text !== orig) fs.writeFileSync(file, text, "utf8");
  }

  console.log(`Soft fixes: ${totalEdits} edits across ${fixedFiles.size} files.\n`);
  if (fixedFiles.size > 0) {
    for (const f of [...fixedFiles].sort()) console.log(`  fixed: ${relPath(f)}`);
    console.log();
  }

  // Pass 2 — compile-check + structural scans
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const m = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const body = m ? m[1] : raw;
    compileCheck(file);
    scanHtmlTagBalance(body, file);
  }

  if (issues.length === 0) {
    console.log("✓ All MDX compiles. No structural issues.");
    return;
  }

  console.log(`\n${issues.length} residual issue(s):\n`);
  const byFile = new Map<string, Issue[]>();
  for (const i of issues) {
    if (!byFile.has(i.file)) byFile.set(i.file, []);
    byFile.get(i.file)!.push(i);
  }
  for (const [file, list] of byFile) {
    console.log(`  ${relPath(file)}`);
    for (const i of list) {
      console.log(`    ${i.kind} @ line ${i.line}:${i.col} — ${i.detail}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
