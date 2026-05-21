"use client";

import { useMemo, useState } from "react";
import { Check, X, RotateCcw, Award, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { recordAttempt, useQuizState, bestScore, type QuizAttempt } from "@/lib/quiz-progress";
import type { Quiz } from "@/lib/quiz";

export function QuizView({ quiz }: { quiz: Quiz }) {
  const state = useQuizState(quiz.unit, quiz.week);
  const best = bestScore(state);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<QuizAttempt | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const answered = Object.keys(answers).length;
  const total = quiz.questions.length;
  const complete = answered === total;

  function setAnswer(qid: string, choice: number) {
    if (submitted) return; // lock after submit
    setAnswers((a) => ({ ...a, [qid]: choice }));
  }

  function submit() {
    let score = 0;
    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctIndex) score++;
    }
    const attempt: QuizAttempt = {
      timestamp: new Date().toISOString(),
      answers,
      score,
      total,
    };
    recordAttempt(quiz.unit, quiz.week, attempt);
    setSubmitted(attempt);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setAnswers({});
    setSubmitted(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted-2)]">{quiz.unit} · Week {quiz.week}</div>
            <h2 className="text-lg font-semibold">{quiz.topic ?? "Quiz"}</h2>
            <div className="mt-1 text-xs text-[var(--color-muted)]">
              {total} questions · {answered} answered
              {submitted && (
                <span className={cn("ml-2 font-mono", scoreColor(submitted.score, submitted.total))}>
                  {submitted.score}/{submitted.total} ({Math.round((submitted.score / submitted.total) * 100)}%)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {best && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] px-2 py-1 text-xs text-[var(--color-muted)]">
                <Award className="size-3" /> best {best.score}/{best.total}
              </span>
            )}
            {!submitted ? (
              <button
                onClick={submit}
                disabled={!complete}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40"
                title={complete ? "Grade quiz" : `Answer all ${total} questions to submit`}
              >
                Submit
              </button>
            ) : (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs hover:text-[var(--color-text)]"
              >
                <RotateCcw className="size-3.5" /> Try again
              </button>
            )}
          </div>
        </div>
        {state.attempts.length > 0 && (
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <ChevronDown className={cn("size-3 transition-transform", historyOpen && "rotate-180")} />
            {state.attempts.length} previous attempt{state.attempts.length === 1 ? "" : "s"}
          </button>
        )}
        {historyOpen && (
          <ul className="mt-2 space-y-0.5 border-t border-[var(--color-border)] pt-2 text-[11px] font-mono text-[var(--color-muted)]">
            {state.attempts.slice().reverse().map((a, i) => (
              <li key={i} className="flex justify-between">
                <span>{new Date(a.timestamp).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                <span className={cn(scoreColor(a.score, a.total))}>{a.score}/{a.total} · {Math.round((a.score / a.total) * 100)}%</span>
              </li>
            ))}
          </ul>
        )}
      </header>

      <ol className="flex flex-col gap-3">
        {quiz.questions.map((q, qi) => {
          const userAnswer = answers[q.id];
          const isCorrect = submitted && userAnswer === q.correctIndex;
          const isWrong = submitted && userAnswer != null && userAnswer !== q.correctIndex;
          return (
            <li
              key={q.id}
              className={cn(
                "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4",
                isCorrect && "border-[var(--color-success)]/40",
                isWrong && "border-[var(--color-danger)]/40",
              )}
            >
              <div className="mb-3 flex items-baseline gap-2">
                <span className="font-mono text-xs text-[var(--color-muted-2)]">Q{qi + 1}.</span>
                <p className="flex-1 text-sm">{q.stem}</p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {q.choices.map((choice, ci) => {
                  const isChosen = userAnswer === ci;
                  const isAnswer = submitted && ci === q.correctIndex;
                  const isMiss = submitted && isChosen && ci !== q.correctIndex;
                  return (
                    <li key={ci}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                          !submitted && isChosen && "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/40",
                          !submitted && !isChosen && "border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surface-2)]",
                          isAnswer && "border-[var(--color-success)] bg-[var(--color-success)]/10",
                          isMiss && "border-[var(--color-danger)] bg-[var(--color-danger)]/10",
                          submitted && !isAnswer && !isMiss && "border-[var(--color-border)] bg-[var(--color-bg)] opacity-60",
                        )}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={isChosen}
                          disabled={!!submitted}
                          onChange={() => setAnswer(q.id, ci)}
                          className="accent-[var(--color-accent)]"
                        />
                        <span className="flex-1">{choice}</span>
                        {isAnswer && <Check className="size-4 text-[var(--color-success)]" />}
                        {isMiss && <X className="size-4 text-[var(--color-danger)]" />}
                      </label>
                    </li>
                  );
                })}
              </ul>
              {submitted && q.explanation && (
                <div className="mt-3 rounded-md bg-[var(--color-surface-2)] p-3 text-xs leading-relaxed text-[#d4d4d8]">
                  <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Why:</span>
                  {q.explanation}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-end gap-2 pt-2">
        {!submitted ? (
          <button
            onClick={submit}
            disabled={!complete}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            Submit ({answered}/{total})
          </button>
        ) : (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm hover:text-[var(--color-text)]"
          >
            <RotateCcw className="size-3.5" /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

function scoreColor(score: number, total: number): string {
  const pct = score / total;
  if (pct >= 0.85) return "text-[var(--color-success)]";
  if (pct >= 0.6) return "text-[var(--color-warning)]";
  return "text-[var(--color-danger)]";
}
