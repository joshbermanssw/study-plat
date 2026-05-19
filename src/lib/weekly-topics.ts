/**
 * Official weekly topics from the USyd 2026 S1 unit outlines, plus a short
 * exam-focused summary per week. Source of truth pulled from:
 *   https://www.sydney.edu.au/units/<CODE>/2026-S1C-N{D|E}-CC.overview.json
 *
 * Keep summaries to 1-3 sentences — they show on the unit dashboard cards.
 */

export interface WeekTopic {
  week: number;
  topic: string;
  summary: string;
}

export type WeeklyTopics = Record<string, WeekTopic[]>;

export const WEEKLY_TOPICS: WeeklyTopics = {
  COMP3027: [
    { week: 1,  topic: "Unit introduction, algorithms and complexity",
      summary: "Course logistics + a refresher on asymptotic complexity, recurrences, and proof techniques. Foundational vocab the rest of the unit depends on — make sure Big-O / Θ / Ω are reflex." },
    { week: 2,  topic: "Greedy algorithms",
      summary: "Exchange-argument proofs of correctness; classic examples (interval scheduling, Huffman, MST via Kruskal/Prim). Exam pattern: justify why greedy is safe with a tight exchange argument." },
    { week: 3,  topic: "Divide and conquer",
      summary: "Master theorem cases, merge sort / closest pair / Karatsuba / FFT-style recurrences. Be fluent at deriving T(n) and applying the master theorem under exam time." },
    { week: 4,  topic: "Dynamic programming (intro)",
      summary: "Optimal substructure + overlapping subproblems. Build the recurrence first, then memoise/tabulate; weighted interval scheduling, LIS, edit distance are canonical." },
    { week: 5,  topic: "Dynamic programming (continued)",
      summary: "Two-dimensional DP (knapsack, matrix-chain), reconstructing the optimal solution from the table, space optimisation. Practice writing recurrences without code." },
    { week: 6,  topic: "Flow networks (intro)",
      summary: "Max-flow min-cut theorem, Ford-Fulkerson, augmenting paths. Be ready to construct an s-t flow network from a problem description." },
    { week: 7,  topic: "Flow networks (continued)",
      summary: "Edmonds-Karp, capacity scaling, bipartite matching as flow. Many exam questions are problem reductions into max-flow — practice spotting them." },
    { week: 8,  topic: "Circulations and reductions",
      summary: "Lower bounds on edges, demands at vertices, transforming hard-looking problems into flow instances. Exam favourite: reduce X to max-flow, prove correctness." },
    { week: 9,  topic: "NP-hardness (intro)",
      summary: "P vs NP, polynomial-time reductions, certificates. Memorise the canonical NP-complete problems (SAT, 3-SAT, Vertex Cover, Independent Set, Clique, Subset Sum, Ham Path)." },
    { week: 10, topic: "NP-hardness (continued)",
      summary: "Constructing reductions on the spot. Practice: 3-SAT → Vertex Cover, Vertex Cover → Independent Set, etc. The exam will demand a written reduction with correctness proof." },
    { week: 11, topic: "Coping with hardness",
      summary: "Approximation algorithms (vertex cover 2-approx, set cover ln n), local search, randomised approaches. Know the approximation ratio and how it's proven." },
    { week: 12, topic: "Dealing with uncertainty",
      summary: "Online algorithms, competitive ratios, randomised data structures. Lighter unit on exam but appears as a short-answer question — focus on competitive analysis." },
    { week: 13, topic: "Review",
      summary: "Past-paper run-through. Treat this as your second-to-last revision pass — most students get the biggest exam lift from this week." },
  ],

  COMP4347: [
    { week: 1,  topic: "Web fundamentals + JavaScript intro",
      summary: "HTTP request/response cycle, status codes, headers, the URL anatomy. JS basics (types, hoisting, ===, function vs arrow, this). Exam will assume rock-solid HTTP." },
    { week: 2,  topic: "HTML and CSS",
      summary: "Semantic HTML5, the box model, flexbox + grid, specificity rules. Read a CSS snippet and predict layout — common short-answer style." },
    { week: 3,  topic: "Advanced HTML/CSS, client-side JS",
      summary: "DOM tree, event delegation, fetch API, async/await, promises. Be able to wire an event handler that talks to a REST endpoint without a framework." },
    { week: 4,  topic: "Browser and rendering process",
      summary: "Critical rendering path: parse HTML → CSSOM → render tree → layout → paint → composite. JS event loop, reflow vs repaint. Exam loves performance pitfalls." },
    { week: 5,  topic: "Server-side: Node.js + Express",
      summary: "Event-driven IO, middleware chain, routing, req/res lifecycle. Be ready to design an Express app from a spec." },
    { week: 6,  topic: "Sessions, routes, MVC",
      summary: "Cookies vs sessions vs JWT, CSRF protection at the session layer, separating routes / controllers / views. Common pitfall: stateless vs stateful auth tradeoffs." },
    { week: 7,  topic: "Connecting to a database",
      summary: "SQL vs NoSQL choices, ORM patterns (Mongoose/Sequelize), N+1 queries, prepared statements. Know how to defend against SQL injection." },
    { week: 8,  topic: "Client-side frameworks",
      summary: "React component model, hooks (useState, useEffect, useMemo), virtual DOM diffing. Reading a React snippet and predicting renders is exam-likely." },
    { week: 9,  topic: "Client-side frameworks (continued)",
      summary: "State management (lifting up, context, Redux-style), forms, controlled vs uncontrolled inputs, accessibility (aria, focus). Compare framework choices." },
    { week: 10, topic: "Web services",
      summary: "REST principles, HTTP verbs, idempotency, status codes, designing resource URLs. Compare REST vs RPC vs GraphQL on tradeoffs." },
    { week: 11, topic: "Web application security",
      summary: "OWASP Top 10: XSS, CSRF, SQLi, IDOR, auth/session flaws, HTTPS/TLS, CORS. Highest-yield exam topic — know mitigations cold." },
    { week: 12, topic: "Industry speakers",
      summary: "Guest lectures — light content. Skim slides for any real-world security/architecture anecdotes that may seed essay questions." },
    { week: 13, topic: "Review, exam structure",
      summary: "Walk through past-paper format. Focus revision on Weeks 4 (rendering), 7 (databases), and 11 (security) — the highest-density topics." },
  ],

  COMP4349: [
    { week: 1,  topic: "Cloud computing overview",
      summary: "NIST cloud definition, IaaS/PaaS/SaaS distinctions, public/private/hybrid models, key business motivations and tradeoffs. Always asked: define + give an example service per layer." },
    { week: 2,  topic: "Cloud storage",
      summary: "Object (S3) vs block (EBS) vs file (EFS) storage; consistency models, durability vs availability tradeoffs, storage classes for cost optimisation. Know when to choose which." },
    { week: 3,  topic: "Cloud compute service",
      summary: "EC2 instance families, AMIs, auto-scaling groups, load balancers (ALB/NLB), spot vs on-demand vs reserved pricing. Sketch a scalable web tier on demand." },
    { week: 4,  topic: "Cloud database",
      summary: "RDS, DynamoDB (NoSQL), Aurora, read replicas, sharding strategies, ACID vs BASE. Exam: choose a DB given workload + justify." },
    { week: 5,  topic: "Cloud networking",
      summary: "VPC, subnets (public/private), security groups vs NACLs, route tables, NAT gateways, peering, transit gateways. Be able to draw a 3-tier VPC topology." },
    { week: 6,  topic: "Cloud security",
      summary: "IAM (users/groups/roles/policies), KMS, encryption at rest + in transit, shared responsibility model. Least privilege + explicit deny precedence are exam staples." },
    { week: 7,  topic: "Cloud monitoring",
      summary: "CloudWatch metrics/alarms/logs, X-Ray tracing, structured vs unstructured logs, key SRE metrics (latency, errors, saturation, traffic). Often a short-answer question." },
    { week: 8,  topic: "Cloud automation",
      summary: "CloudFormation / Terraform IaC, declarative vs imperative, stack lifecycle, drift, parameterisation. Write a small CFN template snippet from a spec." },
    { week: 9,  topic: "Decoupled architectures",
      summary: "SQS (queues), SNS (pub/sub), EventBridge, the fan-out pattern, idempotency keys, dead-letter queues. Know when to use queue vs topic." },
    { week: 10, topic: "Containers & microservices",
      summary: "Docker fundamentals, ECS vs Fargate vs EKS, registry, layered images, 12-factor app principles. Compare monolith → microservices tradeoffs." },
    { week: 11, topic: "Kubernetes",
      summary: "Pods/Deployments/Services/Ingress, scheduler, kube-proxy, etcd, scaling strategies (HPA), rolling updates. High-density exam topic — get the vocab right." },
    { week: 12, topic: "Serverless architectures",
      summary: "Lambda, cold starts, API Gateway, Step Functions, observability gaps, when serverless is the wrong choice. Compare cost + ops with EC2/ECS." },
    { week: 13, topic: "Unit of study review",
      summary: "Past paper walk-through. Focus revision on Weeks 5 (networking), 6 (security), 11 (Kubernetes) — these dominate the exam." },
  ],

  INFO4444: [
    { week: 1,  topic: "Intro: IT innovation, general-purpose & emerging tech",
      summary: "What innovation is, why it matters at the country/company level, the four common emerging tech categories. Definitions-heavy exam content." },
    { week: 2,  topic: "Innovation Frameworks I: Dominant Design",
      summary: "Utterback-Abernathy model, fluid → transitional → specific phases, fluid phase dynamics. Know the diagram and be able to place a real-world product on it." },
    { week: 3,  topic: "Innovation Frameworks II: Disruptive Innovation",
      summary: "Christensen's disruptive vs sustaining, low-end and new-market footholds, the innovator's dilemma. Common essay question: classify a case study." },
    { week: 4,  topic: "Open & closed innovation, distributed innovation I",
      summary: "Chesbrough open innovation framework, inside-out vs outside-in flows, IP boundaries. Memorise the diagrams." },
    { week: 5,  topic: "Distributed innovation II: crowdsourcing, FOSS, user innovation",
      summary: "Crowdsourcing typology (Howe), user-innovation (von Hippel), free/open-source movements. Be ready to compare governance models." },
    { week: 6,  topic: "IP protection: methods and strategies",
      summary: "Patents, trademarks, copyrights, trade secrets, when each applies, defensive vs offensive IP strategy. Highest-yield definitions topic." },
    { week: 7,  topic: "Commercialisation I: Startup vs traditional, lean startup, agile",
      summary: "Customer development process, MVP, build-measure-learn, pivot vs persevere. Likely essay: contrast lean startup vs traditional product development." },
    { week: 8,  topic: "Commercialisation II: Innovation management & strategies",
      summary: "Ambidextrous organisations, exploration vs exploitation, stage-gate process, innovation portfolio matrix. Diagram-heavy week." },
    { week: 9,  topic: "Commercialisation III: Capital & fundraising",
      summary: "Bootstrapping, angels, VCs, valuation basics, term sheets, equity vs convertible notes, dilution. Numerical exam questions appear here." },
    { week: 10, topic: "Innovation ecosystems: Silicon Valley & Australia",
      summary: "Triple helix (industry-uni-government), regional clusters, why Silicon Valley works, Australian challenges (talent density, capital flight). Comparative analysis essay." },
    { week: 11, topic: "Entrepreneurship & startups in practice",
      summary: "Industry-speaker week — light content. Capture concrete anecdotes that might seed essay material." },
    { week: 12, topic: "Project reflection, presentation, discussion",
      summary: "Assignment-focused, low new content. Use as buffer for revision." },
    { week: 13, topic: "Unit review, exam review",
      summary: "Past-paper run-through. Focus revision on Weeks 2 (Utterback-Abernathy), 3 (Christensen), 6 (IP), and 7 (lean startup) — these recur in every paper." },
  ],
};

export function getWeekTopic(unit: string, week: number): WeekTopic | undefined {
  const list = WEEKLY_TOPICS[unit.toUpperCase()];
  return list?.find((t) => t.week === week);
}
