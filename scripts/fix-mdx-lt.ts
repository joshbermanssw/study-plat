/**
 * MDX 3 trips on two patterns when they appear in prose:
 *   `<N` — parsed as a JSX tag open with an invalid name char.
 *   `{X` — parsed as a JSX expression, then acorn fails if X isn't valid JS
 *          (e.g. set notation `{1,..,W}` or `{a,b,c}`).
 *
 * Replace those occurrences with the escape forms in prose, leaving fenced
 * code blocks and inline-backtick spans alone.
 *
 * Run: pnpm exec tsx scripts/fix-mdx-lt.ts
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

function fix(text: string): { out: string; ltFixed: number; lbFixed: number } {
  const fenced = fencedRanges(text);
  let out = "";
  let ltFixed = 0;
  let lbFixed = 0;
  let inBackticks = false;
  let backtickRun = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === "`" && !inAny(fenced, i)) {
      let run = 1;
      while (text[i + run] === "`") run++;
      if (inBackticks && run === backtickRun) {
        inBackticks = false; backtickRun = 0;
      } else if (!inBackticks) {
        inBackticks = true; backtickRun = run;
      }
      out += text.slice(i, i + run);
      i += run - 1;
      continue;
    }

    if (!inAny(fenced, i) && !inBackticks) {
      // Escape `<` unless it's a real HTML/JSX tag start. Valid starts after
      // `<` are a letter, `/`, `!`, or `?`. Everything else (digits, spaces,
      // `<` itself, math symbols) means it's prose/math/code — escape it.
      if (ch === "<") {
        const next = text[i + 1];
        if (!next || !/[a-zA-Z/!?]/.test(next)) {
          out += "&lt;";
          ltFixed++;
          continue;
        }
      }
      // Escape every `{` in prose unless it starts a JSX comment (`{/`).
      // Use HTML entity (works across MDX 3 parsing). Strip any leftover
      // backslash from previous-run escapes so we don't end up with `\&#123;`.
      if (ch === "{") {
        const next = text[i + 1];
        if (next !== "/") {
          if (out.endsWith("\\")) out = out.slice(0, -1);
          out += "&#123;";
          lbFixed++;
          continue;
        }
      }
    }
    out += ch;
  }
  return { out, ltFixed, lbFixed };
}

let totalLt = 0;
let totalLb = 0;
let filesTouched = 0;
for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, "utf8");
  const { out, ltFixed, lbFixed } = fix(text);
  if (ltFixed + lbFixed > 0) {
    fs.writeFileSync(file, out, "utf8");
    console.log(`  ${path.relative(process.cwd(), file)} — ${ltFixed} <N, ${lbFixed} {…} fixed`);
    totalLt += ltFixed;
    totalLb += lbFixed;
    filesTouched++;
  }
}
console.log(`\nDone: ${totalLt} <N + ${totalLb} {…} escapes across ${filesTouched} files.`);
