/**
 * Convert `x_i` / `x_0` / `T_worst` style subscripts in prose to proper
 * Unicode subscript glyphs, so they read like maths instead of raw LaTeX.
 *
 *   s_i, f_i        →  sᵢ, fᵢ
 *   a_0, a_d, a_n   →  a₀, aₐ, aₙ   (Unicode-mapped letters where possible)
 *   T_worst         →  T_worst      (multi-letter subscripts left alone)
 *
 * Skips fenced code blocks and inline-backtick spans, so code stays code.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "content", "units");
const ONLY_UNITS = ["COMP3027"];   // tweak to fan out

// Unicode subscript map. Letters not in the map (b, c, d, f, g, q, w, y, z, capitals)
// stay as `_letter` because there's no glyph to replace them with.
const SUB_MAP: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ",
  "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
  "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ",
  "v": "ᵥ", "x": "ₓ",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
};

function tryToSub(s: string): string | null {
  let out = "";
  for (const ch of s) {
    const m = SUB_MAP[ch];
    if (!m) return null;
    out += m;
  }
  return out;
}

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(abs);
    else if (entry.name === "_teach.mdx") yield abs;
  }
}

function fencedRanges(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const fenceRe = /^([ \t]*)(`{3,}|~{3,})/gm;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(text))) {
    const fence = m[2];
    const openStart = m.index;
    const closeRe = new RegExp(`^([ \\t]*)${fence[0]}{${fence.length},}[ \\t]*$`, "m");
    closeRe.lastIndex = fenceRe.lastIndex;
    const closeMatch = text.slice(fenceRe.lastIndex).match(closeRe);
    if (!closeMatch || closeMatch.index == null) break;
    const closeStart = fenceRe.lastIndex + closeMatch.index;
    const closeEnd = closeStart + closeMatch[0].length;
    out.push([openStart, closeEnd]);
    fenceRe.lastIndex = closeEnd;
  }
  return out;
}

function inAny(ranges: Array<[number, number]>, i: number): boolean {
  for (const [a, b] of ranges) if (i >= a && i < b) return true;
  return false;
}

function transform(text: string): { out: string; changes: number } {
  const fenced = fencedRanges(text);
  let out = "";
  let changes = 0;
  let inBackticks = false;
  let backtickRun = 0;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Track inline backtick spans
    if (ch === "`" && !inAny(fenced, i)) {
      let run = 1;
      while (text[i + run] === "`") run++;
      if (inBackticks && run === backtickRun) { inBackticks = false; backtickRun = 0; }
      else if (!inBackticks) { inBackticks = true; backtickRun = run; }
      out += text.slice(i, i + run);
      i += run;
      continue;
    }

    // Inside code? Pass through.
    if (inAny(fenced, i) || inBackticks) {
      out += ch;
      i++;
      continue;
    }

    // Look for pattern: a letter followed by `_` followed by 1+ lowercase/digit chars
    // ending at a word boundary. Convert the subscript IF every char has a Unicode
    // subscript glyph. Otherwise leave it (e.g. `T_worst` — `w` has no glyph).
    if (/[A-Za-z]/.test(ch) && text[i + 1] === "_" && /[a-z0-9]/.test(text[i + 2] ?? "")) {
      let j = i + 2;
      while (j < text.length && /[a-z0-9]/.test(text[j])) j++;
      const sub = text.slice(i + 2, j);
      const after = text[j] ?? "";
      const isWordEnd = !/[A-Za-z0-9]/.test(after);
      if (isWordEnd) {
        const replacement = tryToSub(sub);
        if (replacement) {
          out += ch + replacement;
          i = j;
          changes++;
          continue;
        }
      }
    }

    out += ch;
    i++;
  }

  return { out, changes };
}

let total = 0;
let files = 0;
for (const file of walk(ROOT)) {
  if (!ONLY_UNITS.some((u) => file.includes(`/${u}/`))) continue;
  const before = fs.readFileSync(file, "utf8");
  const { out, changes } = transform(before);
  if (changes > 0) {
    fs.writeFileSync(file, out, "utf8");
    console.log(`  ${path.relative(process.cwd(), file)} — ${changes} subscripts converted`);
    total += changes;
    files++;
  }
}
console.log(`\nDone: ${total} subscripts across ${files} files.`);
