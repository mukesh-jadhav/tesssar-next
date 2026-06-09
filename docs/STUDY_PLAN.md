# Comparison Studies — Full Spec

> _Tessar's groundbreaker: a comparison cockpit that turns N architectures into
> one defensible decision. Desktop-only. No V1 staging — we build the full
> thing._

## 1 · Vision

A single architect, one brief, **N parallel architectures**, **8 interactive
lenses**, and a **live scenario simulator** that lets them feel the tradeoffs
in real time. Closes with a **pick-and-mix synthesis** — the user composes a
"best of all worlds" architecture from any combination of the variants' picks,
and Tessar produces one coherent final report.

Competitors generate. Tessar **decides**.

---

## 2 · User flow

### 2.1 Build a Study (`/studies/new`)

```
[ Brief textarea — same RefineDisclosure as today                ]

  Compare across one dimension:
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Cloud        │ │ Style        │ │ Datastore    │ │ Deployment   │ │ Cost posture │
  │ GCP·AWS·Azure│ │ Mono·Micro·  │ │ SQL·NoSQL·   │ │ K8s·PaaS·    │ │ Lean·Bal·    │
  │              │ │ Serverless·  │ │ NewSQL·      │ │ Serverless   │ │ Enterprise   │
  │              │ │ Event-driven │ │ Polyglot     │ │              │ │              │
  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

  Pick variants (up to 3):  [✓ GCP] [✓ AWS] [✓ Azure] [ ] Multi-cloud

  Study cost: 95 credits   ·   ~3 min wall-clock   ·  [ Run Study → ]
```

One dimension per study. Multi-dimensional (2D matrix) is explicitly out of
scope — it explodes cost and ruins the matrix.

### 2.2 Study running (`/studies/[id]`)

```
   GCP          ━━━━━━━━━━━━━━●·············  designing data flow…
   AWS          ━━━━━━━━━━━━━━━━━━━━━●······  drafting diagrams…
   Azure        ━━━━━━━●··················  selecting components…
```

Three lanes racing the same 8 phases. Each lane wired into the SIGTERM-drain
+ watchdog so a deploy can't poison the study. If one lane fails, the others
keep running and a "Re-run just AWS" CTA appears for the failed lane (cost: a
single run, 40 cr).

When all lanes complete → auto-redirect to the cockpit.

### 2.3 Cockpit (`/studies/[id]` — same URL, different render)

```
┌──────────────────────────────────────────────────────────────────────┐
│  SCENARIO BAR  100K MAU ━━●━━━━━━━━━ 10M    p95 < 200ms    [region X]│
│ ─────────────────────────────────────────────────────────────────────│
│ ┌─ Lens rail ─┐ ┌─ Stage ──────────────────────────────────────────┐│
│ │ Architecture│ │                                                  ││
│ │ Performance │ │    Three columns. Live-reacts to scenario.       ││
│ │ Scale       │ │    Lens controls what the columns render.        ││
│ │ Cost        │ │                                                  ││
│ │ Reliability │ │                                                  ││
│ │ Security    │ │                                                  ││
│ │ Ops burden  │ │                                                  ││
│ │ Lock-in     │ │                                                  ││
│ │ Verdict     │ │                                                  ││
│ └─────────────┘ └──────────────────────────────────────────────────┘│
│ ┌─ Decision tray ─────────────────────────────────────────────────┐ │
│ │  Components ( )GCP (●)AWS ( )Azure   Datastore (●)GCP ( )AWS ( )Az│
│ │  Messaging  (●)GCP ( )AWS ( )Azure   Deployment ( )GCP (●)AWS ( )Az│
│ │                                            [ Synthesize 20cr → ] │ │
│ └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

Four planes, always visible:
- **Scenario bar** — what you're testing
- **Lens rail** — which axis you're viewing
- **Stage** — the visual
- **Decision tray** — what you're committing to

Single screen. No tabs, no modals for the main flow.

### 2.4 Synthesis (`/studies/[id]/synthesis`)

Final synthesis call feeds the picks back to the agent as a hard-constraint
block. Produces one coherent `Architecture` doc that obeys the picks. Costs
**20 credits** flat (one Gemini call + saves the user a full re-run).

Result is a regular architecture doc — fully shareable, exportable to PDF,
appears in `/history`.

### 2.5 Promotion ("Use as-is")

Every variant gets a free `Use this as-is` shortcut that clears its
`studyId` and promotes it to a normal architecture. No extra credits — it's
already paid for.

---

## 3 · The eight lenses

Each lens occupies the stage. Three variant columns + (optionally) a
verdict gutter. All lenses react to the scenario bar.

### 3.1 Architecture

Three Mermaid diagrams side-by-side (C4-container by default; user can flip
to data-flow or deployment).

- **Linked highlight**: hover any node in one column → its equivalent nodes
  glow in the others. Equivalences are computed by category + responsibility
  semantic match.
- **Click a node** → drawer with the component's responsibility, scaling
  note, alternatives, and the data flows it participates in (per variant).
- Total component count and category histogram below each diagram.

### 3.2 Performance

A response-time-vs-RPS chart with three lines, one per variant. Y-axis log
scale. Lines compose from the agent's `latency_budget_ms` per data flow + the
bottleneck identified per data store.

- Drag the load slider → lines re-shape.
- Where a line crosses the configured latency budget → it goes red, and the
  limiting component is named below: _"AWS exceeds 200ms at 8M MAU — bottleneck:
  Aurora Global secondary replication lag."_
- Per-variant: cold-start estimate, p50/p95/p99 at current scenario.

### 3.3 Scale

Four stacked bars per variant, one per scale tier (startup → hyperscale).
Components colored by category (compute / data / cache / queue / search /
ML / edge / other).

- As the load slider crosses tier boundaries, that tier pulses.
- Above each variant: max sustainable RPS, max recommended MAU, hard ceiling
  (and what hits it first — _"GCP: ceiling = Spanner node limit at 50M MAU"_).

### 3.4 Cost

Three stacked bars: compute / data / network / observability / ML / other.
₹/month at current scenario load.

- Live re-compute as slider drags (linear interp between tier breakpoints
  from `cost_breakdown`).
- Derived metric below: **cost per 1M requests**.
- Multi-region toggle: if the scenario bar's "region failure" is on, costs
  add DR overhead (2× data, 1.4× compute).
- Toggle: "show as USD" (uses INR→USD ratio from arch's `monthly_cost_usd_*`).

### 3.5 Reliability

A failure-mode matrix.

```
                            GCP        AWS        Azure
  Region failure            ✓ multi-r  ✓ multi-r  ⚠ regional only
  DB corruption             ✓ PITR     ✓ PITR     ✓ PITR
  Dependency timeout        ✓ retry+CB ✓ retry+CB ⚠ retry only
  Cache stampede            ✓ singleflt ⚠ TTL only ✓ singleflt
  Hot partition             ✓ sharding ✓ sharding ✗ not addressed
  Queue backlog             ✓ DLQ+lag  ✓ DLQ      ✓ DLQ+lag
  ...
```

Rows computed from `risks` + `applied_patterns`. Toggle scenario "region
failure" → row glows + survival computed: time to recovery, data-loss
window, manual steps.

### 3.6 Security

Compliance × variant grid + attack-surface count.

```
                  GCP          AWS          Azure
  DPDP (India)    ✓ Spanner-IN ⚠ Aurora-IN  ✓ Cosmos-IN
  GDPR            ✓            ✓            ✓
  HIPAA           ⚠ BAA req    ✓ BAA inc    ⚠ BAA req
  PCI-DSS         ✓            ✓            ✓
  SOC2            ✓            ✓            ✓
  Attack surface  3 public eps 5 public eps 4 public eps
```

Per-cell one-line note on click. Compliance picks from the
`Constraints` block the user supplied at study creation.

### 3.7 Ops burden

Single derived score (0–100) per variant + headcount estimate per tier.

```
                  GCP        AWS        Azure
  Ops score        18         34         28
  Eng @ growth     2          3          3
  Eng @ scale      4          7          5
  Managed pct      87%        72%        78%
  Self-run         Spanner    Spanner    None
                              (RDS hot)
                              Kafka
                              ...
```

Score = `(self-run-count × weight) + (proprietary-API × 0.5) +
(custom-glue × 1) - (managed-density × 0.5)`. Opinionated and explicit.

### 3.8 Lock-in

Score 0–10 + top 3 stickiest services per variant.

```
                  GCP        AWS        Azure
  Lock-in score    6/10       8/10       7/10
  Top sticky       Spanner    DynamoDB   Cosmos DB
                   Pub/Sub    Lambda     Service Bus
                   Cloud Run  SQS        Container Apps
  Replaceable in   3 mo       6 mo       4 mo
```

Replacement time = sum of estimated migration days for the sticky services.

### 3.9 Verdict

The synthesis screen. Auto-generated chips:

```
   ✓ Cheapest at your scale:  GCP  (saves ₹6L/mo vs AWS)
   ✓ Lowest ops:              GCP  (18 vs 34 score)
   ✓ Fastest to ship:         AWS  (largest managed catalog)
   ✓ Best India residency:    GCP  (Spanner native, Mumbai region)
   ✓ Lowest lock-in:          GCP  (6 vs 8)
   ⚠ Compliance gaps:         Azure missing DPDP-grade audit logging
```

Each chip has a "why" pop-out with the underlying numbers. Below the
chips → the decision tray comes alive with default picks pre-selected
from the verdicts.

---

## 4 · Scenario engine

A pure-function module that takes `(architecture, scenario)` and returns
re-computed numbers. **No new model inference** — interpolation only.

```ts
type Scenario = {
  loadMau: number;            // continuous, 1K → 100M
  latencyBudgetMs: number;    // 50 | 200 | 500 | 1000
  regionFailureSim: boolean;  // toggle
  costCeilingInr?: number;    // optional ₹/mo ceiling
};

// Pure, no I/O, runs on every slider tick.
function projectScenario(arch: Architecture, sc: Scenario): {
  costInr: { compute: number; data: number; network: number; obs: number; ml: number; other: number };
  costPerMRequests: number;
  p95Ms: number;
  bottleneck: string | null;
  componentBudgets: Record<componentId, { utilizationPct: number; saturated: boolean }>;
  maxSustainableMau: number;
  ceilingComponent: string;
  drOverheadInr: number;     // if regionFailureSim
};
```

Tier interpolation uses `scale_profiles` for the cost low/high band; linear
between adjacent tiers, capped at hyperscale.

Latency line per variant uses the deepest data-flow chain's
`latency_budget_ms` sum + per-component scaling penalty:
`p95 = sum(latency_budget) × (1 + log(load / tier_load) × 0.15)`.

---

## 5 · Dimensions

Each dimension knows its variants and the constraint snippet to inject.

```ts
type Dimension = {
  id: "cloud" | "style" | "datastore" | "deployment" | "cost-posture";
  label: string;
  description: string;
  variants: Variant[];
};

type Variant = {
  id: string;
  label: string;        // shown as column header
  shortBlurb: string;   // shown on builder
  constraint: string;   // injected into the brief as a hard requirement
};
```

### 5.1 `cloud`
- `gcp` — "Design on Google Cloud (Cloud Run, Spanner, Pub/Sub, …)."
- `aws` — "Design on AWS (ECS Fargate, Aurora Global, SNS+SQS, …)."
- `azure` — "Design on Azure (Container Apps, Cosmos DB, Service Bus, …)."
- `multi` — "Design as multi-cloud with explicit per-cloud responsibilities."

### 5.2 `style`
- `monolith` — "Single deployable; modular monolith; clear bounded contexts inside."
- `microservices` — "Per-bounded-context microservices, sync REST/gRPC plus async events."
- `serverless` — "Serverless-first; functions for compute; managed everything; minimize standing servers."
- `event-driven` — "Event-sourced backbone; CQRS where it helps; async by default."

### 5.3 `datastore`
- `sql-primary` — "Single relational system of record (PostgreSQL family)."
- `nosql-primary` — "Document/key-value primary (DynamoDB / Firestore / Cosmos)."
- `newsql` — "Globally consistent NewSQL (Spanner / CockroachDB)."
- `polyglot` — "Polyglot persistence: SQL for transactions, document for catalogs, KV for sessions, search for queries."

### 5.4 `deployment`
- `k8s` — "Container orchestration on GKE/EKS/AKS."
- `paas` — "Managed PaaS (Cloud Run / App Runner / Container Apps)."
- `serverless-fn` — "Functions (Cloud Functions / Lambda / Functions)."

### 5.5 `cost-posture`
- `lean` — "MVP posture: minimum services, single region, accept some manual ops to save 50%."
- `balanced` — "Production-ready, multi-AZ, basic DR. Standard managed services."
- `enterprise` — "Hardened: multi-region active-active, full DR, full audit, premium tiers across the board."

Note: `cost-posture` is the only dimension where all variants stay on the
same cloud — the brief's cloud preference (or GCP default) sticks.

---

## 6 · Data model

```ts
// studies/{id}
StudyDoc = {
  id: string;
  uid: string;
  prompt: string;                    // brief + composed preferences
  dimension: Dimension["id"];
  variants: Array<{
    label: string;                   // user-facing column header (e.g. "GCP")
    variantId: string;               // e.g. "gcp"
    runId: string;                   // → architectures/{runId}
    status: "running" | "complete" | "failed";
    errorMessage?: string;
  }>;
  status: "running" | "complete" | "partial" | "failed";
  // "complete" = all variants complete
  // "partial"  = some complete, some failed (user can still cockpit)
  // "failed"   = all variants failed
  createdAt: number;
  completedAt?: number;
  insights?: {                       // populated when all complete
    cheapestAtScale: { variantId: string; savingsInr: number };
    lowestOps:       { variantId: string; score: number };
    fastestToShip:   { variantId: string; reason: string };
    bestResidency:   { variantId: string; region: string };
    lowestLockIn:    { variantId: string; score: number };
    complianceGaps:  Array<{ variantId: string; regime: string; note: string }>;
  };
  // Final synthesis
  picks?: Record<string, string>;    // sliceKey → variantId
  finalRunId?: string;               // architectures/{finalRunId}
};

// architectures/{id} — unchanged shape, plus optional fields:
ArchitectureDoc = {
  ...existing...
  studyId?: string;                  // back-pointer
  variantLabel?: string;             // e.g. "AWS"
  variantId?: string;                // e.g. "aws"
  synthesizedFrom?: {                // set on final synthesis run
    studyId: string;
    picks: Record<string, string>;
  };
};
```

Studies own runs. Runs stay individually shareable. Promoting a variant
clears its `studyId`/`variantLabel`/`variantId`.

---

## 7 · API surface

### `POST /api/studies`
```jsonc
// req
{
  "brief": "...",
  "preferences": { ...BriefPreferences },
  "dimension": "cloud",
  "variantIds": ["gcp", "aws", "azure"]
}
// res
{ "id": "<studyId>" }
```
Validates length, charges `studyCost(N)` credits atomically (one ledger
entry, `studyId` as `refId`), creates `studies/{id}` + N `architectures/{id}`
docs, fans out N detached workers (each tracked in shutdown registry),
returns within ~300ms.

### `GET /api/studies/[id]/status`
Polled by client every 2.5s. Returns `StudyDoc` with embedded variant
progress (joined from `architectures/{runId}.progress`). Same rate limits
as the existing `/api/architect/[id]/status`. Calls `reapIfStuck` on every
variant.

### `POST /api/studies/[id]/synthesize`
```jsonc
// req
{ "picks": { "components": "aws", "datastore": "gcp", ... } }
// res
{ "finalRunId": "<archId>" }
```
Charges flat `SYNTHESIS_COST_CREDITS` (20). Composes a synthesis brief from
the original brief + the per-slice constraint snippets ("Components MUST
be from the AWS variant: ECS Fargate compute, ALB ingress, …"). Runs the
existing architect agent. Persists `synthesizedFrom` on the result doc and
`finalRunId` on the study.

### `POST /api/studies/[id]/promote`
```jsonc
// req
{ "runId": "<archId>" }
// res
{}
```
No charge. Clears `studyId`/`variantLabel`/`variantId` on the arch doc so
it appears as a normal architecture in `/history`.

### `POST /api/studies/[id]/retry-variant`
```jsonc
// req
{ "variantId": "aws" }
// res
{ "runId": "<newArchId>" }
```
Charges 40 credits. Re-runs that variant only.

---

## 8 · Pricing

```ts
export const SYNTHESIS_COST_CREDITS = 20;

export function studyCost(variantCount: number): number {
  switch (variantCount) {
    case 2: return 70;   // 2 × 40 = 80 → 12% off
    case 3: return 95;   // 3 × 40 = 120 → 21% off
    case 4: return 120;  // 4 × 40 = 160 → 25% off (locked behind quota)
    default: throw new RangeError("Studies allow 2–4 variants");
  }
}
```

A full session — 3-variant study + final synthesis = **115 cr** = 2.9 single
runs. The user gets a decision made, not options to pick from.

Promotion = free.
Retry-one-variant = 40 cr.

---

## 9 · Pipeline (fan-out, fan-in, drain)

### Fan-out
`POST /api/studies` charges credits once, creates docs, then for each variant:

```ts
const work = runVariantWorker(...)
  .catch(err => log.error(...))
  .finally(() => {
    inflight.delete(work);
    untrackRun(runId);
    onVariantTerminal(studyId, variantId);  // bumps study aggregate status
  });
inflight.add(work);
trackRun(runId, { docRef: archRef, uid, studyId, variantId });
```

`trackRun` accepts the optional `studyId`/`variantId` so the SIGTERM drain
can flip both the arch doc *and* surface the variant failure on the study
doc atomically.

### Fan-in (study aggregate status)
Every time a variant lands in a terminal state, a single Firestore
transaction recomputes `study.status`:
- all variants `complete` → `complete` + compute insights
- mixed terminal states → `partial`
- all `failed` → `failed`

### Insights compute
Pure-function pass over the N completed architectures. Runs server-side
when status flips to `complete`. Results written to `study.insights`.
(Pure functions = same code re-used by the cockpit for live recomputes
on slider drag — but the persisted insights are the canonical baseline.)

### Drain integration
The existing `lib/agent/shutdown.ts` registry stays the source of truth.
Study fan-out registers N entries. On SIGTERM, each entry's arch doc
flips to `failed` + refunds. We additionally write a study-level
`status: "failed"` if all variants flip (avoids the cockpit showing
"loading…" forever).

---

## 10 · Synthesis prompt

Takes the original brief + the picks payload and constructs a brief
extension. The agent runs the same way as a normal generation; it just
receives a hard-constraint block listing exactly which services and
patterns to use, sliced by `components` / `datastore` / `messaging` /
`deployment` / `security` / `observability`.

```text
You are synthesizing a FINAL architecture from a comparison study. The
user has chosen a specific variant for each architectural slice. You MUST
honor every pick verbatim — do not substitute, do not propose alternatives.

Original brief:
<brief>

Picks (HARD requirements):
- Components & compute  → from AWS variant
  Required services: ECS Fargate, ALB, CloudFront, ...
- Datastore             → from GCP variant
  Required services: Spanner, Memorystore Redis, ...
- Messaging             → from GCP variant
  Required services: Pub/Sub, ...
- Deployment & CI/CD    → from AWS variant
  Required services: CodePipeline, CodeBuild, ECR, ...
- Security              → from GCP variant
  Required services: VPC-SC, IAM, Cloud KMS, ...
- Observability         → from AWS variant
  Required services: CloudWatch, X-Ray, ...

Cross-cloud notes:
- This is an explicitly multi-cloud design — call out the cost, latency,
  and operational implications of the cross-cloud egress, identity
  federation, and observability fan-in.
- Use the patterns canon (Ambassador, BFF, etc.) appropriate to the
  composition.
```

The slice → required-services list is computed from the source
architectures' `components`/`tech_stack`/`security`/`observability`
sections — no manual mapping.

---

## 11 · Insight computations

Pure functions, no model calls. Live during cockpit slider drag and
also persisted at fan-in time.

```ts
// All implemented in lib/studies/insights.ts

cheapestAtScale(archs, scenario)     // → variantId, ₹/mo savings vs next
lowestOps(archs)                     // → variantId, score
fastestToShip(archs)                 // → variantId, reason
bestResidency(archs, scenario)       // → variantId, region
lowestLockIn(archs)                  // → variantId, score
complianceGaps(archs, regimes)       // → array of gaps

opsScore(arch)                       // 0–100
lockInScore(arch)                    // 0–10
attackSurface(arch)                  // count of public-facing components
projectCost(arch, scenario)          // ₹/mo for current scenario
projectLatency(arch, scenario)       // p95 ms + bottleneck
maxSustainableMau(arch)              // ceiling + ceiling component
```

---

## 12 · Interaction patterns

1. **Live scenario** — slider drag re-paints numbers across all columns at
   60fps. `useMotionValue` for the slider; `useDeferredValue` (React 18) on
   the projected numbers so the slider never stutters.
2. **Linked highlight** — hovering a node/row/bar in any column glows its
   counterparts in the other columns. Computed once when the cockpit
   mounts via a semantic equivalence map (category + responsibility keyword
   overlap).
3. **Click-to-explain** — every number, badge, bar segment is clickable;
   opens a right-side drawer with the agent's reasoning text + the
   relevant arch fragments. The report becomes the docs.
4. **Diff bias** — when all variants agree, the cell greys (`opacity-40`).
   Only differences carry visual weight.
5. **Region failure simulation** — single toggle in the scenario bar.
   Every lens re-acts: Cost adds DR overhead, Reliability glows the
   region-failure row + computes survival, Architecture diagrams overlay a
   dashed strikethrough on the components that go down.
6. **History compare** — top-right of the cockpit: "Compare to past study…"
   dropdown lets you pull a previous study in as a fourth ghost column,
   read-only.
7. **Keyboard** — `1`–`9` jump between lenses, `←`/`→` move between
   variant columns when focused, `Esc` closes drawers.

---

## 13 · Routes & files

### Routes
```
/studies                                  — list (history of studies)
/studies/new                              — builder
/studies/[id]                             — live progress + cockpit (single route, two renders)
/studies/[id]/synthesis                   — synthesis result (redirect to /architecture/[finalRunId])
```

### Files

#### Types & lib
```
src/types/study.ts                        — Study, StudyDoc, Dimension, Variant, Picks
src/lib/studies/dimensions.ts             — the 5 dimensions × variants registry
src/lib/studies/pricing.ts                — studyCost(n), SYNTHESIS_COST_CREDITS
src/lib/studies/orchestrator.ts           — fan-out, fan-in, shutdown-drain integration
src/lib/studies/synthesis.ts              — synthesis brief composer + agent call
src/lib/studies/insights.ts               — pure compute functions
src/lib/studies/scenario.ts               — projectCost, projectLatency, etc.
src/lib/studies/equivalence.ts            — node-equivalence map for linked highlight
```

#### API
```
src/app/api/studies/route.ts              — POST (create)
src/app/api/studies/[id]/status/route.ts  — GET (poll)
src/app/api/studies/[id]/synthesize/route.ts
src/app/api/studies/[id]/promote/route.ts
src/app/api/studies/[id]/retry-variant/route.ts
```

#### Pages
```
src/app/(app)/studies/page.tsx            — history list of studies
src/app/(app)/studies/new/page.tsx        — builder
src/app/(app)/studies/[id]/page.tsx       — live + cockpit (server component shell)
src/app/(app)/studies/[id]/loading.tsx
```

#### Components
```
src/components/studies/
  StudyBuilder.tsx                        — dimension + variant picker
  StudyLive.tsx                           — racing-lane progress
  StudyCockpit.tsx                        — the full cockpit shell
  ScenarioBar.tsx                         — load slider, latency, region, ceiling
  LensRail.tsx                            — vertical lens nav
  DecisionTray.tsx                        — pick-and-mix + synthesize CTA
  VariantHeader.tsx                       — shared column header chip
  ExplainDrawer.tsx                       — right-side click-to-explain drawer
  CompareToPastDialog.tsx                 — history compare dropdown
  lens/
    ArchitectureLens.tsx
    PerformanceLens.tsx
    ScaleLens.tsx
    CostLens.tsx
    ReliabilityLens.tsx
    SecurityLens.tsx
    OpsLens.tsx
    LockInLens.tsx
    VerdictLens.tsx
  chart/
    ResponseTimeChart.tsx
    StackedBarChart.tsx
    DiffMatrix.tsx
```

#### Existing files touched
```
src/lib/agent/shutdown.ts                 — extend InflightRun to carry studyId
src/lib/agent/watchdog.ts                 — surface variant failure to study doc
src/components/architecture/NewArchitectureForm.tsx — add "Compare across …" peer CTA
src/components/workspace/HomeCockpit.tsx           — same CTA
src/components/shared/Footer.tsx          — Studies link in nav
firestore.indexes.json                    — composite indexes for studies queries
firestore.rules                           — rules for studies/{id}
```

---

## 14 · Phases (sequencing for implementation)

Even though we're building the full thing, the build order matters so
each commit lands a coherent slice.

**Phase 0 — Foundation** _(this turn)_
- Types: `study.ts`
- Dimension catalog
- Pricing constants + `studyCost(n)`
- Update `shutdown.ts` to accept optional `studyId`/`variantId` on tracked runs

**Phase 1 — Backend pipeline**
- `studies/orchestrator.ts` (fan-out, fan-in)
- `POST /api/studies`
- `GET /api/studies/[id]/status` (with stuck-variant reaping)
- Firestore rules + indexes for `studies` collection

**Phase 2 — Builder + live progress**
- `/studies/new` page + `StudyBuilder`
- `/studies/[id]` page (server shell)
- `StudyLive` racing-lane component

**Phase 3 — Cockpit shell**
- `StudyCockpit` skeleton
- `ScenarioBar` with `useMotionValue`
- `LensRail`
- `DecisionTray` (CTA wired to synthesis API)
- `VariantHeader`, `ExplainDrawer`

**Phase 4 — Scenario + insights engine**
- `lib/studies/scenario.ts` — pure projections
- `lib/studies/insights.ts` — pure computations
- `lib/studies/equivalence.ts` — node-equivalence map

**Phase 5 — Lenses (in order: easiest → hardest)**
1. Verdict lens (chips + reasoning pop-outs)
2. Cost lens (stacked bars + live recompute)
3. Architecture lens (three Mermaid + linked highlight)
4. Lock-in lens (score + sticky services)
5. Ops burden lens (score + headcount)
6. Security lens (compliance × variant grid)
7. Reliability lens (failure-mode matrix + region-fail simulation)
8. Scale lens (per-tier bars + ceiling)
9. Performance lens (response-time chart + bottleneck callout)

**Phase 6 — Synthesis**
- `lib/studies/synthesis.ts` (brief composer)
- `POST /api/studies/[id]/synthesize`
- Synthesis result drawer + redirect to `/architecture/[finalRunId]`

**Phase 7 — Promote + retry-variant**
- `POST /api/studies/[id]/promote`
- `POST /api/studies/[id]/retry-variant`

**Phase 8 — Studies list page**
- `/studies` history page
- Studies surfaced in `/history` too (mixed feed)

**Phase 9 — Polish**
- Linked highlight wiring across lenses
- Click-to-explain drawer hookups
- Keyboard shortcuts
- History compare dialog
- Empty / failed / partial states
- Marketing copy on `/`

**Phase 10 — Prompt audit**
- Verify AWS / Azure native-service vocabulary parity in `prompts.ts`
- Add per-cloud "preferred services" lists
- Re-run validation studies on a known brief to sanity-check the agent
  isn't biased toward GCP

---

## 15 · Risks

| Risk | Mitigation |
|---|---|
| Vertex `gemini-2.5-pro` per-minute quota with 3 parallel streams | Verify before launch; 3-variant studies are tight but feasible at our current quota; 4-variant gated until quota bump |
| One variant fails — feel of the whole study breaks | First-class "Re-run just AWS" CTA + study renders in `partial` mode |
| Quality drift across clouds — agent gives a stronger GCP design than AWS | Phase-10 prompt audit; expand per-cloud service catalog in `prompts.ts` |
| Mermaid diagrams differ widely → matrix looks chaotic | We deliberately don't diff diagrams. Linked highlight surfaces equivalence; the table does the real work |
| Synthesis produces incoherent multi-cloud designs | The synthesis prompt explicitly flags cross-cloud as a deliberate choice and requires the agent to call out egress, identity, observability implications |
| Cockpit performance with 3 Mermaid diagrams + live scenario | `useDeferredValue` on projected numbers; Mermaid renders once + CSS for highlights |
| User picks every slice from one variant → synthesis = duplicate of that variant | Detect this case at synthesis time and skip the call; just clone the source arch into a synthesized doc (no charge) |

---

## 16 · Out of scope (now)

- **2D matrix** — cloud × style etc. Future. V1 of the feature is one
  dimension at a time.
- **4-variant studies** — gated until we confirm Vertex quota. The
  pricing table is already there, just disabled.
- **Mobile** — explicit non-goal. Cockpit is desktop-only with a
  redirect on small viewports.
- **Diagram diffing** — explicitly rejected.
- **Auto-picks** — the system suggests but never makes the picks for the
  user. Decision agency stays with the architect.
- **Shareable studies** — V2. For now studies are private; only the
  promoted/synthesized arch is shareable.
- **PDF of the cockpit** — V2. Export only works on the synthesized
  final architecture.

---

## 17 · Definition of done

A new user can:

1. Write a brief.
2. Pick a dimension (cloud) and 3 variants (GCP, AWS, Azure).
3. Pay 95 credits.
4. Watch three lanes race to completion in ~3 min.
5. Land in the cockpit and flip through 8 lenses.
6. Drag the load slider and see all columns react live.
7. See auto-generated verdict chips with "why" reasoning.
8. Pick-and-mix slices in the decision tray.
9. Pay 20 credits to synthesize a final coherent architecture.
10. Land on the synthesized architecture in `/history`, export it, share it.

Without ever seeing a "coming soon", a broken state, or having to read
docs.
