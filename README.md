# Study Platform

A personal study dashboard for the final four units of semester. Drops course materials in from Canvas, surfaces them in a per-unit dashboard with exam countdowns, progress tracking, and per-note confidence ratings. Notes are MDX in git; progress is localStorage.

> Built for `canvas.sydney.edu.au`. Local-first, deploys to Vercel.

---

## Quick start

```bash
pnpm install
cp .env.example .env.local        # paste your Canvas token
pnpm sync                          # pull modules, files, exam dates → /data + /content stubs
pnpm dev                           # http://localhost:3000
```

Then open a Claude Code session in this folder and ask Claude to flesh out stubs in `content/units/<CODE>/week-XX/`.

## Canvas token

1. Go to https://canvas.sydney.edu.au/profile/settings
2. **+ New Access Token**, label it "study-platform", no expiry (or 1 month).
3. Paste into `.env.local` as `CANVAS_TOKEN=...`.
4. `pnpm sync` to verify — should list your active enrollments.

Sync is idempotent: existing note files are never overwritten, only NEW stubs are created.

```bash
pnpm sync                # all active enrollments
pnpm sync COMP4347       # one unit only
pnpm sync:dry            # show what would happen, write nothing
```

---

## How it's wired

```
                    canvas.sydney.edu.au
                            │
                  pnpm sync (local, with token)
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       /data/course.json          /content/units/<CODE>/...
       (modules, files,           (MDX stubs — flesh out
        exam dates)                with Claude / by hand)
              │                           │
              └───────────┬───────────────┘
                          ▼
                   Next.js App Router
                          │
                          ▼
                       Vercel
                   (public-but-obscure
                     URL, noindex)
```

State that does NOT round-trip to git:
- **Progress** (read checkboxes, confidence 0–5, study streak) — localStorage only, per-device.
- Use the export/import buttons (TODO) if you switch device.

---

## Project structure

```
study-platform/
├── content/
│   └── units/
│       ├── COMP4347/
│       │   ├── _unit.mdx              ← unit overview
│       │   ├── week-01/
│       │   │   ├── lecture-01-intro.mdx
│       │   │   └── lab-01.mdx
│       │   └── exam/
│       │       ├── cheatsheet.mdx
│       │       └── topics.mdx
│       ├── COMP4349/
│       ├── INFO4444/
│       └── UNIT4/                     ← rename to your 4th unit's code
├── data/
│   └── course.json                    ← written by `pnpm sync`
├── scripts/
│   └── sync-canvas.ts                 ← Canvas REST client + stub generator
└── src/
    ├── app/
    │   ├── page.tsx                   ← /          (dashboard, 4 unit cards)
    │   ├── [unit]/
    │   │   ├── layout.tsx             ← left rail with week nav
    │   │   ├── page.tsx               ← /COMP4347  (unit overview)
    │   │   ├── [...slug]/page.tsx     ← /COMP4347/week-01/lecture-01-intro
    │   │   └── exam/page.tsx          ← /COMP4347/exam
    │   ├── globals.css                ← dark-theme tokens + .prose-note styles
    │   └── layout.tsx                 ← root layout, noindex metadata
    ├── components/
    │   ├── app-shell.tsx              ← sidebar + header layout primitive
    │   ├── unit-card.tsx              ← dashboard card per unit
    │   ├── countdown-chip.tsx         ← coloured days-to-exam pill
    │   ├── week-nav.tsx               ← left rail with collapsible weeks
    │   ├── cmd-k.tsx                  ← ⌘K fuzzy search (fuse.js)
    │   ├── confidence-slider.tsx      ← 1–5 segmented bar
    │   ├── read-toggle.tsx            ← mark-as-read button
    │   └── streak.tsx                 ← current streak chip
    └── lib/
        ├── content.ts                 ← filesystem walk → UnitData
        ├── progress.ts                ← localStorage store + hooks
        ├── units.ts                   ← static unit registry (codes + colours)
        ├── types.ts                   ← Note, WeekGroup, UnitData
        ├── dates.ts                   ← countdown helpers
        └── cn.ts                      ← clsx + tailwind-merge
```

## Frontmatter spec

Every note MDX file:

```yaml
---
title: "Lecture 3 — Routing"        # required
unit: COMP4347                       # required, matches /content/units/<CODE>/
week: 3                              # required for lecture/lab/tutorial; omitted for overview/exam
type: lecture                        # lecture | lab | tutorial | reading | overview | exam
status: stub                         # stub | draft | done
sourceFile: "lec03-routing.pdf"      # optional, shown in sidebar
examWeight: high                     # optional: low | medium | high
order: 0                             # optional, controls week ordering
---
```

## Adding / renaming units

`src/lib/units.ts` is the source of truth for the 4 units you're tracking. Edit it after first sync to set human-readable names, accent colours, and (once you know them) exam dates.

## Stack

- **Next.js 16** App Router · React 19 · TypeScript · Tailwind v4
- **MDX** via `next-mdx-remote-client` (rendered on the server)
- **gray-matter** for frontmatter
- **fuse.js** for ⌘K search
- **date-fns** for countdowns
- **tsx + dotenv** for the sync script

## Workflow with Claude Code

Designed to pair with Claude Code. Typical session:

> "Open `/content/units/COMP4347/week-03/`. Read `lec03-routing.pdf` (linked in frontmatter via `sourceFile`) and fill in this stub following the unit's standard template: TL;DR → Key concepts → Worked examples → Exam-likely questions. Mark `status: draft` when done."

A single session can realistically cover 8–12 lectures.

## Deploy

```bash
vercel
```

Notes for safer deploy:
- Use an obscure project name (random subdomain).
- Robots `noindex` is already wired into the root layout.
- Don't commit `.env.local`.
- Lecture PDFs aren't bundled with the deploy — only your derived markdown notes. Canvas URLs in note frontmatter require auth to follow.

## Roadmap (post-MVP)

- [ ] R2/Supabase upload of source PDFs with signed URLs.
- [ ] Vercel password auth (Clerk or middleware).
- [ ] AI Q&A over notes (Claude API, with prompt caching).
- [ ] Spaced-repetition flashcard mode (generated from notes).
- [ ] Mobile PWA shell.
- [ ] Cross-device progress sync (Supabase, if you ever want it).
