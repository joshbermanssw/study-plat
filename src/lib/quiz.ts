import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string(),
  stem: z.string(),
  choices: z.array(z.string()).min(2).max(8),
  correctIndex: z.number().int().min(0),
  explanation: z.string().optional().default(""),
});

export const QuizSchema = z.object({
  unit: z.string(),
  week: z.number(),
  topic: z.string().optional(),
  questions: z.array(QuestionSchema),
});

export type QuizQuestion = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

const CONTENT_ROOT = path.join(process.cwd(), "content", "units");

export function loadQuiz(unit: string, week: number): Quiz | undefined {
  const file = path.join(CONTENT_ROOT, unit, `week-${String(week).padStart(2, "0")}`, "_quiz.json");
  try {
    const raw = fs.readFileSync(file, "utf8");
    return QuizSchema.parse(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export function loadTeach(unit: string, week: number): { body: string; title?: string } | undefined {
  const file = path.join(CONTENT_ROOT, unit, `week-${String(week).padStart(2, "0")}`, "_teach.mdx");
  try {
    const raw = fs.readFileSync(file, "utf8");
    // Strip simple YAML frontmatter if present (no need for gray-matter here).
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) return { body: raw };
    const fm = m[1];
    const body = m[2];
    const titleMatch = fm.match(/^title:\s*"?([^"\n]+)"?$/m);
    return { body, title: titleMatch?.[1] };
  } catch {
    return undefined;
  }
}
