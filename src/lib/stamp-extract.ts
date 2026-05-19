// JSX-style comments so MDX parses them as no-op expressions instead of bombing
// on the unfamiliar `<!--`.
const START = "{/* canvas-extract-start */}";
const END = "{/* canvas-extract-end */}";

/** Choose a backtick fence longer than any run already in the text. */
function pickFence(text: string): string {
  const max = (text.match(/`{3,}/g) ?? []).reduce((m, s) => Math.max(m, s.length), 0);
  return "`".repeat(Math.max(3, max + 1));
}

export function hasExtractedSection(body: string): boolean {
  return body.includes(START);
}

/**
 * Insert or replace the auto-extracted section in a stub body. Preserves the
 * user's prose above the markers and just rewrites the block between them.
 */
export function stampExtract(body: string, extractedText: string, summary: string): string {
  const fence = pickFence(extractedText);
  const block = [
    START,
    "<details>",
    `<summary>${summary}</summary>`,
    "",
    `${fence}text`,
    extractedText.trim(),
    fence,
    "",
    "</details>",
    END,
  ].join("\n");

  // Strip any legacy HTML-comment markers from earlier versions.
  const oldStart = "<!-- canvas-extract-start -->";
  const oldEnd = "<!-- canvas-extract-end -->";
  const oldRe = new RegExp(`${escapeRe(oldStart)}[\\s\\S]*?${escapeRe(oldEnd)}`, "g");
  const cleaned = body.replace(oldRe, "").trimEnd();

  if (cleaned.includes(START)) {
    const re = new RegExp(`${escapeRe(START)}[\\s\\S]*?${escapeRe(END)}`);
    return cleaned.replace(re, block);
  }
  return `${cleaned}\n\n${block}\n`;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split a note body into the user-editable prose and the preserved auto-extract
 * tail. The editor only ever sees the `user` portion; on save we rejoin with
 * the original `preserved` tail so the extracted-text block is never touched.
 */
export function splitBody(body: string): { user: string; preserved: string } {
  const idx = body.indexOf(START);
  if (idx === -1) return { user: body, preserved: "" };
  return {
    user: body.slice(0, idx).replace(/\s+$/, ""),
    preserved: body.slice(idx),
  };
}

export function joinBody(user: string, preserved: string): string {
  const u = user.replace(/\s+$/, "");
  if (!preserved) return u + "\n";
  return `${u}\n\n${preserved.replace(/^\s+/, "")}`;
}
