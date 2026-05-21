/**
 * One-shot: COMP4347's sync put 24 PDF stubs in week-01 because the agent
 * couldn't parse `Wn` from the filenames. Re-distribute them.
 *
 * Mapping derived from titles/filenames (manually verified — see report).
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const UNIT_DIR = path.join(process.cwd(), "content", "units", "COMP4347");

// slug → correct week number
const MOVES: Array<[string, number]> = [
  // Tutorials — week matches tutorial number
  ["week-01/comp5347-4347-tutorial-2-htm-and-css", 2],
  ["week-01/comp5347-4347-tutorial-4-browser-and-http-1", 4],
  // Lectures by week
  ["week-01/comp5347-w4-critical-rendering-async-js-optimisation-1", 4],
  ["week-01/comp5347-w5-serversidedev-nodejs-1", 5],
  ["week-01/comp5347-w6-node-express-mvc-introtomongo-1", 6],
  ["week-01/comp5347-w7-databaselayer-mongoose-1", 7],
  ["week-01/comp5347-w8-clientside-frameworks-1", 8],
  ["week-01/l9-frontend-frameworks-react-comp5347-1", 9],
  ["week-01/comp5347-w10-web-services-1", 10],
  ["week-01/comp5347-w11-security-1", 11],
  ["week-01/comp5347-week-l11-tutorial-web-security", 11],
  // Topical reference — Mongo cheatsheet best fits week 7 (database)
  ["week-01/mongo-db-shell-cheat-sheet", 7],
];

let moved = 0;
let kept = 0;
for (const [oldSlug, newWeek] of MOVES) {
  const oldPath = path.join(UNIT_DIR, `${oldSlug}.mdx`);
  if (!fs.existsSync(oldPath)) { console.log(`  skip (missing): ${oldSlug}`); kept++; continue; }

  const basename = path.basename(oldSlug);
  const newWeekDir = `week-${String(newWeek).padStart(2, "0")}`;
  const newDir = path.join(UNIT_DIR, newWeekDir);
  fs.mkdirSync(newDir, { recursive: true });
  const newPath = path.join(newDir, `${basename}.mdx`);

  // Update frontmatter `week` field too
  const raw = fs.readFileSync(oldPath, "utf8");
  const parsed = matter(raw);
  parsed.data.week = newWeek;
  const updated = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(newPath, updated, "utf8");
  fs.unlinkSync(oldPath);

  console.log(`  moved: ${oldSlug}  →  ${newWeekDir}/${basename}`);
  moved++;
}

console.log(`\n${moved} moved, ${kept} unchanged.`);
