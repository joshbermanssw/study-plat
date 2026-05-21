/**
 * Milkdown's remark-stringify escapes `*` to `\*` when round-tripping. That
 * corrupts our `{/ * ... * /}` JSX comment markers and breaks MDX rendering.
 * Walk every MDX file and undo the escape.
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

const BAD_OPEN = "{/" + "\\" + "*";   // literal: {/\*
const BAD_CLOSE = "\\" + "*/}";        // literal: \*/}
const GOOD_OPEN = "{/" + "*";
const GOOD_CLOSE = "*/}";

let touched = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.split(BAD_OPEN).join(GOOD_OPEN).split(BAD_CLOSE).join(GOOD_CLOSE);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    touched++;
    console.log("  fixed " + path.relative(process.cwd(), file));
  }
}
console.log("\nDone: " + touched + " file(s) fixed.");
