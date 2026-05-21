/**
 * HTML entities (&#123;, &lt;, &gt;, &amp;) inside fenced code blocks render
 * as literal text — they should be raw `{`, `<`, `>`, `&` in code. Agents
 * sometimes apply the entity defensively even inside fences. Undo that.
 *
 * Inline backtick spans get the same treatment.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "content", "units");

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(abs);
    else if (entry.name.endsWith(".mdx")) yield abs;
  }
}

// Find fence regions [start, end) where contents should be raw.
function fencedRanges(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const fenceRe = /^([ \t]*)(`{3,}|~{3,})/gm;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(text))) {
    const fence = m[2];
    const openStart = m.index;
    // Range we want: AFTER the opening fence's newline, BEFORE the closing fence.
    const afterOpenLine = text.indexOf("\n", fenceRe.lastIndex) + 1;
    const closeRe = new RegExp(`^([ \\t]*)${fence[0]}{${fence.length},}[ \\t]*$`, "m");
    const tail = text.slice(afterOpenLine);
    const closeMatch = tail.match(closeRe);
    if (!closeMatch || closeMatch.index == null) break;
    const closeStart = afterOpenLine + closeMatch.index;
    out.push([afterOpenLine, closeStart]);
    fenceRe.lastIndex = closeStart + closeMatch[0].length;
  }
  return out;
}

// Inline backtick spans (single-line, balanced count).
function backtickSpans(text: string, fences: Array<[number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const inFence = (i: number) => fences.some(([a, b]) => i >= a && i < b);
  for (let i = 0; i < text.length; i++) {
    if (inFence(i)) continue;
    if (text[i] === "`") {
      let r = 1;
      while (text[i + r] === "`") r++;
      // find matching close
      let j = i + r;
      while (j < text.length) {
        if (text[j] === "\n") break;
        if (text[j] === "`") {
          let cr = 1;
          while (text[j + cr] === "`") cr++;
          if (cr === r) {
            out.push([i + r, j]);  // content between the backticks
            i = j + cr - 1;
            break;
          }
          j += cr;
        } else j++;
      }
    }
  }
  return out;
}

let totalReverts = 0;
let filesTouched = 0;

for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, "utf8");
  const fences = fencedRanges(text);
  const inlineSpans = backtickSpans(text, fences);
  const protectedRanges = [...fences, ...inlineSpans];
  if (protectedRanges.length === 0) continue;

  let out = "";
  let cursor = 0;
  let edits = 0;
  // Sort ranges by start position
  protectedRanges.sort((a, b) => a[0] - b[0]);
  for (const [start, end] of protectedRanges) {
    // Append text outside this range unchanged
    out += text.slice(cursor, start);
    let inside = text.slice(start, end);
    // Revert entities INSIDE the protected range
    const before = inside;
    inside = inside.replace(/&#123;/g, "{")
                   .replace(/&#125;/g, "}")
                   .replace(/&lt;/g, "<")
                   .replace(/&gt;/g, ">");
    if (inside !== before) {
      // Count edits
      edits += (before.match(/&#12[35];|&lt;|&gt;/g) || []).length;
    }
    out += inside;
    cursor = end;
  }
  out += text.slice(cursor);

  if (edits > 0) {
    fs.writeFileSync(file, out, "utf8");
    console.log(`  ${path.relative(process.cwd(), file)} — ${edits} entity reverts`);
    totalReverts += edits;
    filesTouched++;
  }
}

console.log(`\nDone: ${totalReverts} reverts across ${filesTouched} files.`);
