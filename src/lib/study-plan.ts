/**
 * 30-day parallel-exam study plan, hand-authored.
 *
 * Strategy:
 *   Phase 1 (May 19-25): Foundation — cover weeks 1-3 of all four units.
 *   Phase 2 (May 26-Jun 1): Mid-content — weeks 4-7 of each unit.
 *   Phase 3 (Jun 2-8): Hardest material + first past papers.
 *   Phase 4 (Jun 9-13): COMP4349-focused with INFO4444 revision; exam Sat 13 Jun.
 *   Phase 5 (Jun 14-17): Back-to-back exam runway — INFO4444 (15), COMP4347 (16), COMP3027 (17).
 *
 * Rules of thumb baked in:
 *   - 1-2 deep-focus sessions per day, max 3 with light review.
 *   - The day before an exam is always 100% on that unit.
 *   - Sunday is a half-day; Saturday is full.
 *   - Past-paper passes start in week 3, not before — context first, drill second.
 */

import type { UnitCode } from "./types";

export type Emphasis = "foundation" | "mid" | "deep" | "exam-prep" | "exam-day" | "rest";

export interface PlanSession {
  unit: UnitCode | "—";
  topic: string;
  /** Approximate hours allocated; informational, not enforced. */
  hours: number;
}

export interface PlanDay {
  date: Date;
  emphasis: Emphasis;
  /** Optional callout — exam day, rest day, etc. */
  callout?: string;
  sessions: PlanSession[];
}

/** Inclusive range of the plan. */
export const PLAN_START = new Date(2026, 4, 19); // 19 May 2026 (Tue)
export const PLAN_END = new Date(2026, 5, 17);   // 17 Jun 2026 (Wed) — final exam

export const PLAN: PlanDay[] = [
  // ───────────── Phase 1: Foundation (May 19-25) ─────────────
  { date: new Date(2026, 4, 19), emphasis: "foundation", sessions: [
    { unit: "COMP3027", topic: "W1-2: complexity refresh + greedy", hours: 2 },
    { unit: "INFO4444", topic: "W1-2: intro + Utterback-Abernathy dominant design", hours: 2 },
    { unit: "—",         topic: "Build cheatsheet skeletons (one A4 per unit)", hours: 1 },
  ]},
  { date: new Date(2026, 4, 20), emphasis: "foundation", sessions: [
    { unit: "COMP4347", topic: "W1-2: HTTP, JS fundamentals, HTML/CSS box model", hours: 2 },
    { unit: "COMP4349", topic: "W1-2: NIST cloud, storage classes (S3/EBS/EFS)", hours: 2 },
  ]},
  { date: new Date(2026, 4, 21), emphasis: "foundation", sessions: [
    { unit: "COMP3027", topic: "W3: Divide & conquer, master theorem drills", hours: 2 },
    { unit: "COMP4347", topic: "W3: advanced CSS, DOM events, fetch/async", hours: 2 },
  ]},
  { date: new Date(2026, 4, 22), emphasis: "foundation", sessions: [
    { unit: "COMP4349", topic: "W3: EC2 families, auto-scaling, load balancers", hours: 2 },
    { unit: "INFO4444", topic: "W3: Christensen disruptive vs sustaining", hours: 2 },
  ]},
  { date: new Date(2026, 4, 23), emphasis: "foundation", callout: "Saturday — full day", sessions: [
    { unit: "COMP3027", topic: "W4-5: DP intro + 2D DP (knapsack, edit distance)", hours: 3 },
    { unit: "COMP4347", topic: "W4: critical rendering path, event loop", hours: 2 },
  ]},
  { date: new Date(2026, 4, 24), emphasis: "rest", callout: "Sunday — half day", sessions: [
    { unit: "—",         topic: "Light review: revisit cheatsheets, fill gaps", hours: 1.5 },
    { unit: "INFO4444", topic: "W4: open/closed innovation diagrams", hours: 1.5 },
  ]},
  { date: new Date(2026, 4, 25), emphasis: "foundation", sessions: [
    { unit: "COMP4349", topic: "W4: RDS, DynamoDB, ACID vs BASE", hours: 2 },
    { unit: "COMP3027", topic: "DP problem set (5 problems, hand-written)", hours: 2 },
  ]},

  // ───────────── Phase 2: Mid-content (May 26-Jun 1) ─────────────
  { date: new Date(2026, 4, 26), emphasis: "mid", sessions: [
    { unit: "COMP4347", topic: "W5: Node.js + Express middleware chain", hours: 2 },
    { unit: "INFO4444", topic: "W5: crowdsourcing, FOSS governance", hours: 2 },
  ]},
  { date: new Date(2026, 4, 27), emphasis: "mid", sessions: [
    { unit: "COMP3027", topic: "W6: Max-flow min-cut, Ford-Fulkerson", hours: 2.5 },
    { unit: "COMP4349", topic: "W5: VPC, subnets, security groups vs NACLs", hours: 2 },
  ]},
  { date: new Date(2026, 4, 28), emphasis: "mid", sessions: [
    { unit: "COMP4347", topic: "W6: sessions/cookies/JWT, CSRF mitigations", hours: 2 },
    { unit: "INFO4444", topic: "W6: IP — patents/trademarks/copyright/trade secret", hours: 2 },
  ]},
  { date: new Date(2026, 4, 29), emphasis: "mid", sessions: [
    { unit: "COMP3027", topic: "W7: Edmonds-Karp, bipartite matching as flow", hours: 2.5 },
    { unit: "COMP4349", topic: "W6: IAM, KMS, shared responsibility", hours: 2 },
  ]},
  { date: new Date(2026, 4, 30), emphasis: "mid", callout: "Saturday", sessions: [
    { unit: "COMP4347", topic: "W7: DB connections, ORMs, SQLi defence", hours: 2 },
    { unit: "COMP3027", topic: "W8: Circulations + flow reductions practice", hours: 2 },
    { unit: "INFO4444", topic: "W7: lean startup, MVP, pivot", hours: 1 },
  ]},
  { date: new Date(2026, 4, 31), emphasis: "rest", callout: "Sunday — half day", sessions: [
    { unit: "—",         topic: "Past paper skim (COMP3027 + COMP4349) — no marking", hours: 2 },
  ]},
  { date: new Date(2026, 5, 1), emphasis: "mid", sessions: [
    { unit: "COMP4349", topic: "W7-8: monitoring + IaC (CloudFormation)", hours: 2 },
    { unit: "INFO4444", topic: "W8: ambidextrous orgs, stage-gate", hours: 2 },
  ]},

  // ───────────── Phase 3: Deep + past papers (Jun 2-8) ─────────────
  { date: new Date(2026, 5, 2), emphasis: "deep", sessions: [
    { unit: "COMP3027", topic: "W9-10: NP-hardness, write 2 reductions by hand", hours: 3 },
    { unit: "COMP4347", topic: "W8: React hooks, virtual DOM diffing", hours: 2 },
  ]},
  { date: new Date(2026, 5, 3), emphasis: "deep", sessions: [
    { unit: "COMP4349", topic: "W9: SQS/SNS, idempotency, DLQs", hours: 2 },
    { unit: "INFO4444", topic: "W9: capital, valuation, term sheets (numerical Qs)", hours: 2 },
  ]},
  { date: new Date(2026, 5, 4), emphasis: "deep", sessions: [
    { unit: "COMP3027", topic: "Past paper #1 — timed, full 2-hour run", hours: 2 },
    { unit: "COMP3027", topic: "Mark + identify 3 weakest topics", hours: 1 },
    { unit: "COMP4349", topic: "W10: containers, ECS vs EKS", hours: 1.5 },
  ]},
  { date: new Date(2026, 5, 5), emphasis: "deep", sessions: [
    { unit: "COMP4347", topic: "W9-10: frameworks cont + REST/GraphQL", hours: 2.5 },
    { unit: "INFO4444", topic: "W10: Silicon Valley vs Australia ecosystem", hours: 2 },
  ]},
  { date: new Date(2026, 5, 6), emphasis: "deep", callout: "Saturday — full day", sessions: [
    { unit: "COMP4349", topic: "W11: Kubernetes — pods/deployments/services + hands-on", hours: 3 },
    { unit: "COMP3027", topic: "W11: approximation algorithms + ratio proofs", hours: 2 },
  ]},
  { date: new Date(2026, 5, 7), emphasis: "rest", callout: "Sunday — half day", sessions: [
    { unit: "COMP4347", topic: "Past paper #1 — timed", hours: 2 },
    { unit: "—",         topic: "Cheatsheet refinement — all 4 units", hours: 1 },
  ]},
  { date: new Date(2026, 5, 8), emphasis: "deep", sessions: [
    { unit: "COMP4347", topic: "W11: OWASP Top 10 — write mitigation table from memory", hours: 2.5 },
    { unit: "COMP4349", topic: "W12: serverless tradeoffs, cold starts", hours: 1.5 },
  ]},

  // ───────────── Phase 4: COMP4349 exam runway (Jun 9-13) ─────────────
  { date: new Date(2026, 5, 9), emphasis: "exam-prep", callout: "4 days to COMP4349", sessions: [
    { unit: "COMP4349", topic: "Past paper #1 — timed + marked", hours: 2 },
    { unit: "COMP4349", topic: "Drill weak topics (likely k8s + networking)", hours: 1.5 },
    { unit: "INFO4444", topic: "Review W1-5 from cheatsheet", hours: 1 },
  ]},
  { date: new Date(2026, 5, 10), emphasis: "exam-prep", callout: "3 days to COMP4349", sessions: [
    { unit: "COMP4349", topic: "Past paper #2 + retro on common mistakes", hours: 2.5 },
    { unit: "INFO4444", topic: "Review W6-10 (IP, commercialisation, ecosystems)", hours: 1.5 },
  ]},
  { date: new Date(2026, 5, 11), emphasis: "exam-prep", callout: "2 days to COMP4349", sessions: [
    { unit: "COMP4349", topic: "Cheatsheet final — one A4 max", hours: 1.5 },
    { unit: "COMP4349", topic: "Speed-drill: 30 short-answer style questions", hours: 1.5 },
    { unit: "INFO4444", topic: "Past paper #1 — untimed", hours: 1.5 },
  ]},
  { date: new Date(2026, 5, 12), emphasis: "exam-prep", callout: "Eve of COMP4349 — sleep early", sessions: [
    { unit: "COMP4349", topic: "Light: cheatsheet + key diagrams only. No new content.", hours: 1.5 },
    { unit: "—",         topic: "Logistics check: ID, exam venue, allowed materials", hours: 0.5 },
  ]},
  { date: new Date(2026, 5, 13), emphasis: "exam-day", callout: "★ COMP4349 EXAM (Sat 13 Jun)", sessions: [
    { unit: "COMP4349", topic: "Exam morning: re-read cheatsheet only", hours: 0.5 },
    { unit: "—",         topic: "EXAM",                                  hours: 2 },
    { unit: "—",         topic: "Rest + decompress",                     hours: 4 },
    { unit: "INFO4444", topic: "Evening: past paper #2 (untimed)", hours: 1.5 },
  ]},

  // ───────────── Phase 5: 3 exams in 3 days (Jun 14-17) ─────────────
  { date: new Date(2026, 5, 14), emphasis: "exam-prep", callout: "Eve of INFO4444", sessions: [
    { unit: "INFO4444", topic: "Past paper #3 + mark", hours: 2 },
    { unit: "INFO4444", topic: "Cheatsheet final + revise Christensen, IP, lean", hours: 2 },
    { unit: "COMP4347", topic: "Light: OWASP Top 10 mnemonic", hours: 1 },
  ]},
  { date: new Date(2026, 5, 15), emphasis: "exam-day", callout: "★ INFO4444 EXAM (Mon 15 Jun) → COMP4347 next day", sessions: [
    { unit: "INFO4444", topic: "Morning: cheatsheet skim", hours: 0.5 },
    { unit: "—",         topic: "EXAM",                                  hours: 2 },
    { unit: "COMP4347", topic: "Afternoon: past paper #2 — timed", hours: 2 },
    { unit: "COMP4347", topic: "Evening: drill OWASP + DB topics", hours: 1.5 },
  ]},
  { date: new Date(2026, 5, 16), emphasis: "exam-day", callout: "★ COMP4347 EXAM (Tue 16 Jun) → COMP3027 next day", sessions: [
    { unit: "COMP4347", topic: "Morning: cheatsheet skim", hours: 0.5 },
    { unit: "—",         topic: "EXAM",                                  hours: 2 },
    { unit: "COMP3027", topic: "Afternoon: NP-hardness re-derive 2 reductions", hours: 2 },
    { unit: "COMP3027", topic: "Evening: past paper #2 — timed", hours: 2 },
  ]},
  { date: new Date(2026, 5, 17), emphasis: "exam-day", callout: "★ COMP3027 EXAM (Wed 17 Jun) — finish line", sessions: [
    { unit: "COMP3027", topic: "Morning: cheatsheet + Master Theorem warmup", hours: 1 },
    { unit: "—",         topic: "EXAM",                                  hours: 2 },
    { unit: "—",         topic: "🎉 Done — go celebrate",                hours: 0 },
  ]},
];

export function planForDate(d: Date): PlanDay | undefined {
  const key = d.toDateString();
  return PLAN.find((p) => p.date.toDateString() === key);
}

export interface UnitTotals { unit: string; hours: number; sessions: number }

export function unitTotals(): UnitTotals[] {
  const map = new Map<string, UnitTotals>();
  for (const day of PLAN) {
    for (const s of day.sessions) {
      if (s.unit === "—") continue;
      const t = map.get(s.unit) ?? { unit: s.unit, hours: 0, sessions: 0 };
      t.hours += s.hours;
      t.sessions += 1;
      map.set(s.unit, t);
    }
  }
  return [...map.values()].sort((a, b) => b.hours - a.hours);
}
