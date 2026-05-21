export type UnitCode = string;

export type NoteType = "lecture" | "lab" | "tutorial" | "reading" | "overview" | "exam" | "ai-overview";

/**
 * Lifecycle of a note:
 *   stub    — Canvas item exists but nothing's been downloaded yet
 *   synced  — file pulled from Canvas + text extracted; ready to read but not user-edited
 *   draft   — user has written/edited prose (set automatically by saveNoteBody)
 *   done    — user marks the note as exam-ready
 */
export type NoteStatus = "stub" | "synced" | "draft" | "done";

export interface NoteFrontmatter {
  title: string;
  unit: UnitCode;
  week?: number;
  type: NoteType;
  status: NoteStatus;
  sourceFile?: string;
  examWeight?: "low" | "medium" | "high";
  order?: number;

  // populated by Canvas sync / download flow
  canvasUrl?: string;
  canvasFileId?: number;     // Canvas file id; only set for File-type module items
  canvasItemType?: string;   // "File" | "Page" | "Assignment" | ...
  module?: string;
  localFile?: string;        // path relative to project root, e.g. "data/sources/INFO4444/foo.pdf"
  fetchedAt?: Date;          // when the localFile was last pulled from Canvas
  editedAt?: Date;           // when saveNoteBody last wrote this stub
  fileSize?: number;
  fileContentType?: string;
}

export interface Note extends NoteFrontmatter {
  slug: string;
  href: string;
  body: string;
}

export interface WeekGroup {
  week: number;
  topic?: string;     // official USyd schedule topic, see weekly-topics.ts
  summary?: string;   // 1-3 sentence exam-focused overview
  notes: Note[];
}

export interface UnitMeta {
  code: UnitCode;
  name: string;
  examDate?: Date;
  color?: string;
  canvasCourseId?: number;
}

export interface UnitData extends UnitMeta {
  weeks: WeekGroup[];
  exam: Note[];
  overview?: Note;
  allNotes: Note[];
}
