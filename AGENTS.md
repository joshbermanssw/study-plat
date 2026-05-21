<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Study Platform — handoff for future agents

Personal exam-prep app the user (Josh) is using to study **4 USyd units** with exams Jun 13–17 2026. Local-only (no Vercel deploy). `pnpm dev` on port 3000.

## What's in here at a glance

```
src/app/                    — Next.js 16 App Router
  page.tsx                  — / (dashboard)
  plan/page.tsx             — /plan (30-day study calendar)
  sync/page.tsx             — /sync (Canvas tick-list + bulk download UI)
  api/sources/[...path]     — streams PDFs from data/sources (path-traversal guarded)
  [unit]/                   — /COMP4347 etc.
    layout.tsx              — AppShell + WeekNav sidebar
    page.tsx                — unit overview with week cards
    [...slug]/page.tsx      — individual note page (Milkdown editor + PDF iframe)
    study/[week]/page.tsx   — Teach me | Quiz | Notes tabs
    exam/page.tsx           — exam-mode aggregator

src/lib/                    — content loader, types, dates, units, weekly-topics, study-plan, quiz, visibility
src/components/             — UI: app-shell, week-nav, milkdown-editor, milkdown-toolbar, quiz, today-panel, etc.

content/units/<CODE>/       — MDX content
  _unit.mdx                 — unit overview (rendered on /CODE)
  week-NN/_teach.mdx        — long-form lesson (rendered on /CODE/study/N "Teach me" tab)
  week-NN/_quiz.json        — 20-30 MCQs (rendered on the Quiz tab)
  week-NN/<slug>.mdx        — downloaded/uploaded PDF stubs (rendered on /CODE/week-NN/<slug>)

data/sources/<CODE>/        — actual PDFs (gitignored — 123 MB across 4 units)
data/course.json            — Canvas sync output (modules, assignments, calendar)

scripts/                    — see "Tooling" section below
```

## Tooling — run these before / after editing content

Always run `scripts/sweep-mdx.ts` after any MDX edit. It is the canonical typography/syntax fixer:

```bash
pnpm exec tsx scripts/sweep-mdx.ts
```

It will compile-check every `.mdx` and auto-fix soft issues. The rules it enforces in PROSE (not code fences):
- `{` → `&#123;`, `}` → `&#125;` (bare `{` triggers MDX expression parsing)
- `<` followed by non-letter/`/`/`!`/`?` → `&lt;`
- `\{` / `\&#123;` leftover → strip backslash
- `&amp;#123;` double-encoded → `&#123;`
- non-breaking space ` ` → regular space
- `<https://...>` autolink → `[url](url)`
- `^&#123;X&#125;` and `^(X)` → `<sup>X</sup>`

In code fences (` ``` ` and inline backticks):
- entities are stripped back to raw characters (entities don't decode in code blocks).

Other one-shot scripts (idempotent, safe to re-run):
- `scripts/unicode-subscripts.ts` — converts `x_i` → `xᵢ`, `L_max` → `Lₘₐₓ` (only where every char has a Unicode subscript glyph).
- `scripts/sync-canvas.ts` — Canvas REST sync (needs `CANVAS_TOKEN` in `.env.local`).
- `scripts/redistribute-comp4347.ts` — one-shot done; kept for reference.
- `scripts/test-mdx.mjs` — single-file MDX compile checker (used by sweep-mdx + manual debugging).
- `scripts/fix-mdx-lt.ts` — superset of sweep rules; the canonical sweep is the place to add new typography rules.

## MDX syntax rules — DO NOT VIOLATE

These are the rules every agent has stumbled over. The user has hit each one personally; they will notice.

| In prose | In code fences |
| --- | --- |
| `&#123;` `&#125;` for braces | raw `{` `}` |
| `&lt;` for math/comparison `<` | raw `<` |
| `<sup>X</sup>` for multi-char exponents | raw `^X` |
| Unicode subscripts: `sᵢ`, `Lₘₐₓ`, `Σⱼ` (only where every char has a glyph — a,e,h,i,j,k,l,m,n,o,p,r,s,t,u,v,x; digits; +-=()) | leave as `s_i` if intentional |
| `[text](url)` links — NEVER `<url>` | raw URLs fine in code |
| `T(n) ≤ c·g(n)` Unicode operators OK | raw ASCII fine |

## Accessibility / writing-quality rules — the W2-style

The user struggles with dense academic language. The canonical "good" example is the rewritten exchange-argument proof in `content/units/COMP3027/week-02/_teach.mdx` under `### The proof, step by step`. Match its shape:

- **One idea per sentence.** Break compound sentences.
- **Define jargon before use.** First mention = plain English. Optional second = formal name in italics. The user has explicitly flagged "Where the fuck did colours come from" when something appeared without setup — name nothing without introducing it.
- **Lead with intuition, then formalise.**
- **Bolded mini-claims** for skimmability. Bold the claim, not the whole sentence.
- **Short paragraphs** (2-4 sentences max). Whitespace is good.
- **ASCII pictures** where there's a structural intuition (timelines, recursion trees, cuts).
- **Numbered steps for any chain** of `≤`, `=`, `⊆`, implications. Each step gets an English narration sentence.
- **Drop or replace** "invariant", "WLOG", "trivially", "clearly", "obviously", "this buys us X" — define them or rephrase.
- **Worked examples step-by-step** — never write "clearly". Derive every transition.

Default target for the three technical units (COMP3027, COMP4347, COMP4349): 3000-4500 words, 8-14 H2 sections (most ≥250 words). These units have proofs, code, and algorithm derivations that need the room.

### INFO4444 has NO word-count target

INFO4444 is a theoretical / framework unit (Christensen, Utterback-Abernathy, Chesbrough, Lean Startup, Triple Helix, IP categories). It is concept-driven, not calculation-driven. Every section should:

1. **Name the framework** + the originating thinker + year.
2. **Give one concrete case study** (real company, real outcome).
3. **State the critique** or limitation (every framework has one).

Once those three things are done, **stop writing**. Don't pad with "why this matters today" or "looking ahead" filler. If the lecture covers a framework in 8 slides, your section can be 8 paragraphs — no need to inflate.

Concise + complete > long + repetitive. If you find yourself restating the same concept in different words for "depth", delete the second pass.

## How `_teach.mdx` content gets generated — recommended workflow

When the user asks to rebuild a teach file:

1. **Read the per-week PDF extracted text first.** Each `content/units/<CODE>/week-NN/<other>.mdx` has an `{/* canvas-extract-start */}` block with raw PDF text. Use that as the **primary checklist**. The exam reflects what THIS lecturer emphasises, not what the textbook covers.
2. **Match the W2 style** above.
3. **Run `pnpm exec tsx scripts/sweep-mdx.ts`** after writing.
4. **Verify the route returns 200**: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/<UNIT>/study/<N>`.

For bulk regeneration: dispatch one sub-agent per `_teach.mdx` (one per week) in parallel via background agents. Examples of working prompts are in the recent chat history — they include the per-week required-topics checklist + the W2 style + the MDX syntax rules.

## Active feature surface

### Already shipped
- Dashboard `/` with TodayPanel + 4 unit cards.
- `/plan` 30-day study calendar (data in `src/lib/study-plan.ts`).
- `/sync` Canvas tick-and-download UI + bulk text extraction.
- Per-unit page with week cards, Study → button removed (AI Overview pseudo-note serves that purpose).
- Note page with split-pane Milkdown editor + PDF iframe.
- Milkdown editor has formatting toolbar + Rich/Markdown toggle.
- localStorage editor safety net.
- Quiz UI with localStorage attempt history.
- Drag-and-drop PDF uploader (per unit, scroll to bottom of `/CODE`).
- Subscript / superscript / table support (remark-gfm wired).
- ~62 per-PDF summaries auto-extracted via `unpdf` and stamped into stub bodies.

### Pitched but not built (in priority order)
1. **Practice-question generator** — Claude API reads a note's extracted text and generates MCQs + short-answer for active recall. Highest exam-impact lever.
2. **Cheatsheet auto-builder** — one-A4 per unit. Study plan literally schedules 4 of these.
3. **AI Q&A** on each note page — Claude API with prompt caching.
4. **Cross-device progress sync** — Supabase, optional.

## Known gotchas

- **Filename → week regex in uploader**: don't use `\b` for word boundaries near `_W2_`; underscore is a regex word char. Use `[\s_\-.]` separator classes. Fixed in `src/components/unit-uploader.tsx` `inferWeek()`.
- **lucide-react is v1.16** (a fork, not the typical v0.x). Icon names mostly match the standard.
- **Next.js 16** with App Router and Turbopack. `params` is a Promise — must `await`. See `node_modules/next/dist/docs/` before writing routes.
- **`force-dynamic`** is set on note + study pages so content edits show up without rebuild.
- **Dev server may be running** in background (port 3000). Don't auto-start without checking. To start: `cd /Users/josh/Desktop/study-platform && pnpm dev`.
- **The user is on Mac with Apple Silicon.** `grep` may be aliased to `ugrep` (different regex behaviour). Use `awk`/`python3` for reliable scanning. The dev server log is at `/private/tmp/claude-501/...`.
- **`data/sources/` is gitignored** (123 MB of PDFs). Don't try to commit them.
- **The exam dates in `src/lib/units.ts`** are real (Jun 13–17 2026). The Today panel and countdown chips depend on these.

## User communication preferences (observed)

- **Decisive and fast** — picks options quickly, doesn't want long debates.
- **Calls out specific text snippets** when frustrated. The fix is always to (a) acknowledge what they pasted, (b) patch that exact sentence, (c) sweep the pattern across the unit. Don't lecture about why MDX is weird.
- **Frowns on token-burning** at extreme scale. They asked for "10 subagents per doc" once — I pushed back to 1-per-doc with a stricter checklist and they accepted. Sane parallelism over indiscriminate fan-out.
- **No drift** — does not want me to over-engineer. "Just build" is the mood.

## Files NOT to touch without asking

- `src/lib/units.ts` — exam dates + unit codes are user-curated.
- `src/lib/study-plan.ts` — the 30-day calendar is human-readable and human-edited.
- `data/sources/` — gitignored, large binary.
- `.env.local` — Canvas token; never commit.

## Suggested skills for the next session

Skills loaded automatically when starting a Claude Code session:
- `superpowers:verification-before-completion` — apply before claiming a fix is done. Run the sweeper + smoke a route.
- `superpowers:test-driven-development` — for any new server-action or lib code.
- `claude-api` — if building the practice-question generator or AI Q&A panel.
- `frontend-design:frontend-design` — only if doing UI polish.

Skim recent git log and `data/course.json` for what's current. The dev server log under `/private/tmp/claude-501/...` shows live errors.
