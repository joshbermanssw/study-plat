import type { Note } from "./types";

/**
 * A note is "visible" on the unit / week views once it has real content to
 * point at. Pure stubs (Canvas item discovered but nothing downloaded and no
 * user prose) are hidden — they live on the /sync page until ticked.
 */
export function isVisibleNote(n: Note): boolean {
  if (n.type === "ai-overview") return true; // synthetic teach pages always show
  if (n.localFile) return true;              // downloaded → has extracted text
  if (n.status && n.status !== "stub") return true;
  return false;
}
