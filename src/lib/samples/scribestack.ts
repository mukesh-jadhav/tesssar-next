import type { Architecture } from "@/types/architecture";

/**
 * A hand-crafted sample architecture used on the public landing page
 * so visitors can see the product before signing up.
 *
 * Domain: "ScribeStack" — a realtime collaborative document editor
 * (think Notion x Google Docs, India-first).
 */
export const SAMPLE_ARCHITECTURE: Architecture = {
  meta: {
    title: "ScribeStack",
    one_liner:
      "Realtime collaborative document workspace for Indian SMBs — CRDT-backed, offline-first, India-resident data.",
    domain: "B2B SaaS · Productivity · Realtime collaboration",
    generated_at: new Date("2026-06-01T08:00:00Z").toISOString(),
    version: 1,
  },
  executive_summary:
    "ScribeStack is a Notion-class collaborative editor optimized for the Indian SMB market. The architecture is event-sourced over a CRDT (Yjs) for last-writer-wins-free merges, served from a Cloud Run + Firestore core with a websocket fleet on GKE Autopilot for low-latency sync. Documents shard by workspace, search runs on Vertex AI embeddings + BigQuery vector indices, and an analytics pipeline replays the CRDT log into BigQuery for usage insights. The system is designed to land cleanly in asia-south1 (Mumbai) with a hot read replica in asia-south2 (Delhi) for sub-50ms p99 across India, and is GDPR/DPDP ready out of the gate.",
  requirements: {
    functional: [
      "Realtime multi-cursor collaborative editing with offline support",
      "Workspaces, teams, granular page-level permissions",
      "AI-assisted writing (summarize, rewrite, translate) using Gemini",
      "Full-text + semantic search across all accessible pages",
      "Version history with point-in-time restore (90 days)",
      "Comments, mentions, and inline tasks",
      "Public share links with optional password & expiry",
      "Import from Google Docs / Notion / Markdown",
    ],
    non_functional: [
      "p99 sync latency < 80ms within India",
      "99.95% monthly uptime SLO for the editor",
      "Zero data loss (RPO=0) via CRDT log shipping",
      "DPDP Act 2023 compliance — data residency in India",
      "End-to-end TLS 1.3, AES-256 at rest, CMEK for enterprise tier",
      "Horizontal scaling to 100K concurrent editors per cluster",
      "Document load < 800ms p95 on 4G",
    ],
    assumptions: [
      "Initial TAM is 50K paid SMB seats over 18 months",
      "Average document size < 200KB; long-tail to 5MB",
      "AI feature usage is bursty — assume 3 AI calls per active user per day",
      "Enterprise tier ships in Phase 3; design supports CMEK but does not enforce yet",
    ],
    out_of_scope: [
      "Native mobile apps (responsive web first, RN in Phase 4)",
      "On-prem / VPC-peered deployments",
    ],
  },
  components: [
    {
      id: "web",
      name: "Web Editor",
      category: "frontend",
      technology: "Next.js 14, Yjs, Tiptap, served via Cloud CDN",
      responsibility: "Renders the collaborative editor, manages local CRDT state, syncs over websocket.",
      scaling: "Static; scales infinitely via Cloud CDN edge cache.",
      alternatives: ["Remix + Yjs", "SvelteKit + Yjs"],
    },
    {
      id: "edge",
      name: "Edge Gateway",
      category: "edge",
      technology: "Cloud Load Balancer + Cloud Armor + Cloud CDN",
      responsibility: "TLS termination, WAF, DDoS, geo-routing, static asset cache.",
      scaling: "Google-managed, global anycast.",
      alternatives: ["Cloudflare in front of GCP"],
    },
    {
      id: "api",
      name: "REST API",
      category: "api",
      technology: "Cloud Run (Node 20, Fastify), autoscaled 1→200",
      responsibility: "Auth-checked CRUD for workspaces, pages, permissions, billing.",
      scaling: "CPU-based autoscale, min=1, max=200, concurrency=80.",
      alternatives: ["GKE Autopilot", "App Engine Standard"],
    },
    {
      id: "sync",
      name: "Realtime Sync Fleet",
      category: "service",
      technology: "GKE Autopilot, Node + Yjs server, HPA on connections",
      responsibility: "Websocket sync hub; relays CRDT updates between connected clients per page room.",
      scaling: "HPA target 4K connections/pod; sticky routing via consistent hash.",
      alternatives: ["Cloud Run with websocket support (limited)", "Self-hosted Hocuspocus"],
    },
    {
      id: "log",
      name: "CRDT Log Store",
      category: "queue",
      technology: "Pub/Sub topic per workspace shard + GCS cold archive",
      responsibility: "Durable append-only log of all CRDT updates; source of truth for replay & analytics.",
      scaling: "Pub/Sub is auto-scaling; topics partitioned by workspace_id.",
      alternatives: ["Kafka on Confluent Cloud"],
    },
    {
      id: "oltp",
      name: "Document Metadata DB",
      category: "database",
      technology: "Firestore (Native Mode), asia-south1 multi-region",
      responsibility: "Workspaces, pages metadata, permissions, comments, presence.",
      scaling: "Auto-shards by document key; composite indexes for permission queries.",
      alternatives: ["AlloyDB for PostgreSQL", "Spanner for global"],
    },
    {
      id: "snapshot",
      name: "Snapshot Store",
      category: "storage",
      technology: "Cloud Storage with object versioning, lifecycle to Nearline @ 30d",
      responsibility: "Periodic page snapshots (every 30s of activity) for fast cold load & restore.",
      scaling: "Object storage scales infinitely; multi-region bucket in asia.",
      alternatives: ["Firestore document for small pages"],
    },
    {
      id: "cache",
      name: "Hot Cache",
      category: "cache",
      technology: "Memorystore for Redis (Standard HA), 5GB",
      responsibility: "Hot page snapshots, presence list, rate-limit counters, session cache.",
      scaling: "Vertical to 300GB; shard by workspace for >300GB.",
      alternatives: ["Cloud MemoryDB", "Self-hosted Dragonfly"],
    },
    {
      id: "search",
      name: "Search Service",
      category: "service",
      technology: "Cloud Run + BigQuery vector index + Vertex AI text-embedding-005",
      responsibility: "Hybrid keyword + semantic search across all permitted pages.",
      scaling: "BigQuery is serverless; Cloud Run autoscales the query orchestrator.",
      alternatives: ["Vertex AI Vector Search", "Elastic Cloud on GCP"],
    },
    {
      id: "ai",
      name: "AI Assist Service",
      category: "ml",
      technology: "Cloud Run + Vertex AI Gemini 2.5 Flash with prompt cache",
      responsibility: "Summarize, rewrite, translate, generate; respects per-workspace rate limits.",
      scaling: "Cloud Run min=0 max=50; Vertex quota-managed.",
      alternatives: ["Direct browser-side Gemini Nano for offline drafts"],
    },
    {
      id: "billing",
      name: "Billing & Subscriptions",
      category: "service",
      technology: "Cloud Run + Razorpay Subscriptions, Cloud Tasks for retries",
      responsibility: "Plans, trials, invoices, dunning, INR + USD pricing.",
      scaling: "Low-traffic, single Cloud Run service, max=5.",
      alternatives: ["Chargebee", "Stripe Billing"],
    },
    {
      id: "auth",
      name: "Identity",
      category: "auth",
      technology: "Google Identity Platform (Firebase Auth) — Google + Email link + SAML SSO",
      responsibility: "User identity, MFA, SSO for enterprise, session tokens.",
      scaling: "Google-managed.",
      alternatives: ["Auth0", "Clerk"],
    },
    {
      id: "obs",
      name: "Observability",
      category: "observability",
      technology: "Cloud Monitoring + Cloud Trace + Cloud Logging + Error Reporting",
      responsibility: "Metrics, traces, logs, alerts, dashboards, SLO burn rate.",
      scaling: "Google-managed; log routing to BigQuery sink.",
      alternatives: ["Grafana Cloud", "Datadog"],
    },
  ],
  tech_stack: [
    { layer: "Web frontend", choice: "Next.js 14 + Tiptap + Yjs", rationale: "Mature CRDT editor stack; SSR for share links.", alternatives: ["Remix", "SvelteKit"] },
    { layer: "Realtime sync", choice: "Yjs over websockets on GKE Autopilot", rationale: "Sticky long-lived connections need pod-aware routing.", alternatives: ["Liveblocks", "PartyKit"] },
    { layer: "Sync API", choice: "Cloud Run (Node 20, Fastify)", rationale: "Serverless, scales to zero, fits CRUD workload.", alternatives: ["GKE Autopilot"] },
    { layer: "OLTP metadata", choice: "Firestore", rationale: "Hierarchical permissions, sub-collection queries, multi-region.", alternatives: ["AlloyDB"] },
    { layer: "Event log", choice: "Pub/Sub + GCS archive", rationale: "Decouples sync fleet from analytics; durable replay.", alternatives: ["Kafka"] },
    { layer: "Cache", choice: "Memorystore Redis HA", rationale: "Low-latency presence + hot snapshots.", alternatives: ["MemoryDB"] },
    { layer: "Search", choice: "BigQuery vector index + Vertex embeddings", rationale: "Serverless hybrid search at India scale.", alternatives: ["Vertex Vector Search"] },
    { layer: "AI", choice: "Vertex AI Gemini 2.5 Flash", rationale: "Cost-effective for short writing assists.", alternatives: ["Pro for long docs"] },
    { layer: "Auth", choice: "Identity Platform", rationale: "SSO + SAML in same surface as consumer auth.", alternatives: ["Auth0"] },
    { layer: "Payments", choice: "Razorpay Subscriptions", rationale: "India-first, UPI Autopay, INR-native.", alternatives: ["Stripe India"] },
    { layer: "IaC", choice: "Terraform", rationale: "Multi-env, audit-friendly.", alternatives: ["Pulumi"] },
    { layer: "CI/CD", choice: "Cloud Build + Cloud Deploy", rationale: "Native to GCP; integrates with Artifact Registry & Binary Authorization.", alternatives: ["GitHub Actions"] },
  ],
  data_flows: [
    { step: 1, from: "Web Editor", to: "Edge Gateway", action: "Open page → fetch snapshot URL", protocol: "HTTPS", payload: "GET /pages/:id (cookie auth)", latency_budget_ms: 40 },
    { step: 2, from: "Edge Gateway", to: "REST API (Cloud Run)", action: "Authorize + fetch metadata + signed snapshot URL", protocol: "HTTPS", payload: "page meta + GCS V4 signed URL", latency_budget_ms: 60 },
    { step: 3, from: "Web Editor", to: "Cloud Storage", action: "Download last snapshot directly", protocol: "HTTPS", payload: "Yjs binary update, ~50-200KB", latency_budget_ms: 250 },
    { step: 4, from: "Web Editor", to: "Realtime Sync Fleet", action: "Open websocket to page room (consistent-hashed)", protocol: "WSS", payload: "subscribe(roomId)", latency_budget_ms: 80 },
    { step: 5, from: "Web Editor", to: "Realtime Sync Fleet", action: "Push CRDT delta on keystroke (debounced 80ms)", protocol: "WSS binary", payload: "Yjs update ~50-500B", latency_budget_ms: 30 },
    { step: 6, from: "Realtime Sync Fleet", to: "All peers in room", action: "Broadcast CRDT delta", protocol: "WSS binary", payload: "Yjs update", latency_budget_ms: 40 },
    { step: 7, from: "Realtime Sync Fleet", to: "Pub/Sub", action: "Publish CRDT delta to workspace topic", protocol: "Pub/Sub", payload: "Yjs update + meta", latency_budget_ms: 50 },
    { step: 8, from: "Snapshot Worker", to: "Cloud Storage", action: "Every 30s of activity, write new snapshot", protocol: "HTTPS", payload: "Yjs binary, 50KB-5MB" },
    { step: 9, from: "Pub/Sub", to: "BigQuery", action: "Stream into analytics table for usage metrics", protocol: "Pub/Sub → BQ subscription", payload: "Structured event row" },
  ],
  data_model: {
    entities: [
      {
        name: "Workspace",
        fields: [
          { name: "id", type: "string (PK)" },
          { name: "name", type: "string" },
          { name: "plan", type: "enum(free, team, business, enterprise)" },
          { name: "region", type: "string", notes: "data residency" },
          { name: "createdAt", type: "timestamp" },
        ],
        relationships: ["has many Members", "has many Pages"],
      },
      {
        name: "Member",
        fields: [
          { name: "uid", type: "string (PK)" },
          { name: "workspaceId", type: "string (FK)" },
          { name: "role", type: "enum(owner, admin, editor, commenter, viewer)" },
        ],
        relationships: ["belongs to Workspace", "belongs to User"],
      },
      {
        name: "Page",
        fields: [
          { name: "id", type: "string (PK)" },
          { name: "workspaceId", type: "string (FK)" },
          { name: "parentId", type: "string?", notes: "tree" },
          { name: "title", type: "string" },
          { name: "snapshotKey", type: "string", notes: "GCS object" },
          { name: "snapshotVersion", type: "int" },
          { name: "updatedAt", type: "timestamp" },
        ],
        relationships: ["belongs to Workspace", "has many Comments", "has many Snapshots"],
      },
      {
        name: "Snapshot",
        fields: [
          { name: "pageId", type: "string (FK)" },
          { name: "version", type: "int" },
          { name: "objectKey", type: "string" },
          { name: "createdAt", type: "timestamp" },
        ],
        relationships: ["belongs to Page"],
      },
      {
        name: "Comment",
        fields: [
          { name: "id", type: "string (PK)" },
          { name: "pageId", type: "string (FK)" },
          { name: "authorUid", type: "string" },
          { name: "anchor", type: "json", notes: "Yjs relative position" },
          { name: "body", type: "markdown" },
        ],
        relationships: ["belongs to Page"],
      },
    ],
    storage_strategy:
      "Hot metadata in Firestore (sharded by workspaceId), binary state in Cloud Storage versioned bucket, CRDT log durably in Pub/Sub with 7-day retention then GCS archive, analytics in BigQuery via Pub/Sub→BQ subscription.",
  },
  api_surface: [
    { method: "POST", path: "/v1/workspaces", purpose: "Create a workspace", auth: "Firebase ID token", rate_limit: "10/min/user" },
    { method: "GET", path: "/v1/pages/:id", purpose: "Fetch page metadata + signed snapshot URL", auth: "Firebase ID token + page ACL", rate_limit: "120/min/user" },
    { method: "POST", path: "/v1/pages/:id/comments", purpose: "Add a comment", auth: "Firebase ID token + commenter+ role" },
    { method: "WSS", path: "/sync/:roomId", purpose: "Bidirectional CRDT sync", auth: "Short-lived sync token (60s)", rate_limit: "10K msgs/min/connection" },
    { method: "POST", path: "/v1/ai/assist", purpose: "AI write/rewrite/translate", auth: "Firebase ID token", rate_limit: "60/hour/user" },
    { method: "POST", path: "/v1/search", purpose: "Hybrid keyword + semantic search", auth: "Firebase ID token", rate_limit: "60/min/user" },
    { method: "POST", path: "/v1/billing/checkout", purpose: "Razorpay subscription checkout", auth: "Firebase ID token" },
    { method: "POST", path: "/v1/webhooks/razorpay", purpose: "Subscription lifecycle events", auth: "HMAC signature" },
  ],
  diagrams: [
    {
      id: "context",
      title: "C4 — System Context",
      kind: "c4-context",
      description: "External actors and adjacent systems ScribeStack interacts with.",
      mermaid: `flowchart TD
    user[Knowledge Worker]:::actor
    admin[Workspace Admin]:::actor
    scribe([ScribeStack]):::system
    google[Google Workspace<br/>Import]:::external
    notion[Notion<br/>Import]:::external
    razorpay[Razorpay<br/>Subscriptions]:::external
    gemini[Vertex AI<br/>Gemini]:::external
    user -- edits docs --> scribe
    admin -- manages workspace --> scribe
    scribe -- imports --> google
    scribe -- imports --> notion
    scribe -- charges --> razorpay
    scribe -- AI assist --> gemini
    classDef actor fill:#fef3c7,stroke:#a16207,color:#111
    classDef system fill:#0a0a0a,stroke:#0a0a0a,color:#fff
    classDef external fill:#1e293b,stroke:#64748b,color:#fff`,
    },
    {
      id: "container",
      title: "C4 — Containers",
      kind: "c4-container",
      description: "Top-level containers and their relationships inside the ScribeStack boundary.",
      mermaid: `flowchart LR
    subgraph Edge
      CDN[Cloud CDN + Armor]
    end
    subgraph App
      WEB[Web Editor<br/>Next.js]
      API[REST API<br/>Cloud Run]
      SYNC[Realtime Sync<br/>GKE Autopilot]
      AI[AI Assist<br/>Cloud Run]
      SEARCH[Search<br/>Cloud Run]
      BILL[Billing<br/>Cloud Run]
    end
    subgraph Data
      FS[(Firestore<br/>metadata)]
      GCS[(Cloud Storage<br/>snapshots)]
      RED[(Memorystore<br/>Redis)]
      PS[[Pub/Sub<br/>CRDT log]]
      BQ[(BigQuery<br/>analytics + vectors)]
    end
    WEB --> CDN --> API
    WEB -- WSS --> SYNC
    API --> FS
    API --> GCS
    SYNC --> PS
    SYNC --> RED
    PS --> BQ
    SEARCH --> BQ
    SEARCH --> FS
    AI --> FS
    BILL --> FS`,
    },
    {
      id: "deployment",
      title: "Deployment — GCP asia-south1 + asia-south2",
      kind: "deployment",
      description: "Multi-region active-passive with hot read replicas for sub-50ms reads across India.",
      mermaid: `flowchart TB
    subgraph asia_south1[asia-south1 · Mumbai · PRIMARY]
      LB1[Global HTTPS LB]
      RUN1[Cloud Run services]
      GKE1[GKE Autopilot sync pods]
      FS1[(Firestore<br/>multi-region)]
      GCS1[(GCS<br/>multi-region)]
    end
    subgraph asia_south2[asia-south2 · Delhi · READ]
      RUN2[Cloud Run reader]
      RED2[(Memorystore replica)]
    end
    LB1 --> RUN1
    LB1 --> GKE1
    RUN1 --> FS1
    RUN1 --> GCS1
    RUN2 --> FS1
    RUN2 --> RED2`,
    },
    {
      id: "sync-sequence",
      title: "Sequence — Realtime Edit Propagation",
      kind: "sequence",
      description: "What happens between two collaborating users when one types a character.",
      mermaid: `sequenceDiagram
    participant A as Alice (Web)
    participant LB as Edge LB
    participant S as Sync Pod (GKE)
    participant B as Bob (Web)
    participant PS as Pub/Sub
    A->>LB: WSS update (Yjs delta)
    LB->>S: Sticky-routed by roomId
    S->>S: Apply delta, broadcast to room
    S-->>B: WSS delta
    S->>PS: Publish to workspace topic
    Note over PS: Snapshot worker consumes,<br/>writes GCS snapshot every 30s
    PS-->>B: (n/a, async)`,
    },
    {
      id: "data-flow",
      title: "Data Flow — Document Load to Live Edit",
      kind: "data-flow",
      description: "End-to-end happy path from cold load to first synced keystroke.",
      mermaid: `flowchart LR
    U[User clicks page] --> M[GET metadata]
    M --> A{ACL ok?}
    A -- no --> E[403]
    A -- yes --> SU[Signed snapshot URL]
    SU --> SN[Download snapshot from GCS]
    SN --> WS[Open WSS to sync pod]
    WS --> ED[Editor live]
    ED -->|keystroke| D[Debounced CRDT delta]
    D --> S[Sync pod broadcasts]
    S --> L[Pub/Sub log]`,
    },
    {
      id: "er",
      title: "ER — Core Domain Model",
      kind: "er",
      description: "Workspaces, members, pages, snapshots, comments.",
      mermaid: `erDiagram
    WORKSPACE ||--o{ MEMBER : has
    WORKSPACE ||--o{ PAGE : owns
    PAGE ||--o{ SNAPSHOT : versions
    PAGE ||--o{ COMMENT : holds
    USER ||--o{ MEMBER : joins
    PAGE }o--|| PAGE : parent

    WORKSPACE {
      string id PK
      string name
      string plan
      string region
    }
    PAGE {
      string id PK
      string workspaceId FK
      string parentId FK
      string title
      string snapshotKey
      int snapshotVersion
    }
    SNAPSHOT {
      string pageId FK
      int version
      string objectKey
      timestamp createdAt
    }
    MEMBER {
      string uid PK
      string workspaceId FK
      string role
    }
    COMMENT {
      string id PK
      string pageId FK
      string authorUid
      string body
    }`,
    },
  ],
  scale_profiles: [
    {
      tier: "startup",
      expected_users: "< 10K MAU, < 200 concurrent",
      expected_rps: "< 50 RPS",
      storage_estimate: "< 50 GB documents",
      read_write_ratio: "10:1",
      changes_from_baseline: [
        "Single Cloud Run service per concern, min=0",
        "Single Memorystore Basic 1GB",
        "Firestore single-region asia-south1",
        "No GKE — sync runs on Cloud Run (single-region)",
      ],
      monthly_cost_inr_low: 18_000,
      monthly_cost_inr_high: 35_000,
      monthly_cost_usd_low: 215,
      monthly_cost_usd_high: 420,
    },
    {
      tier: "growth",
      expected_users: "10K – 500K MAU, 5K concurrent",
      expected_rps: "50 – 1K RPS",
      storage_estimate: "50 GB – 2 TB",
      read_write_ratio: "8:1",
      changes_from_baseline: [
        "GKE Autopilot for websocket sync (sticky)",
        "Memorystore Standard HA 5GB",
        "Firestore multi-region asia-south1",
        "BigQuery vector index for semantic search",
      ],
      monthly_cost_inr_low: 1_25_000,
      monthly_cost_inr_high: 2_40_000,
      monthly_cost_usd_low: 1_500,
      monthly_cost_usd_high: 2_900,
    },
    {
      tier: "scale",
      expected_users: "500K – 10M MAU, 50K concurrent",
      expected_rps: "1K – 20K RPS",
      storage_estimate: "2 TB – 30 TB",
      read_write_ratio: "6:1",
      changes_from_baseline: [
        "Sync fleet sharded by workspace prefix, 50+ pods",
        "Memorystore cluster mode 50GB+",
        "Pub/Sub partitioned topics per workspace shard",
        "Read-replica region in asia-south2 (Delhi)",
        "AlloyDB introduced for billing/analytics queries",
      ],
      monthly_cost_inr_low: 9_50_000,
      monthly_cost_inr_high: 18_00_000,
      monthly_cost_usd_low: 11_500,
      monthly_cost_usd_high: 21_700,
    },
    {
      tier: "hyperscale",
      expected_users: "10M+ MAU, 500K+ concurrent",
      expected_rps: "20K+ RPS",
      storage_estimate: "30 TB+",
      read_write_ratio: "5:1",
      changes_from_baseline: [
        "Cell-based architecture — independent stamps per region (Deployment Stamps pattern)",
        "Spanner replaces Firestore for global strong consistency",
        "Memorystore → Memorystore for Valkey cluster, regional shards",
        "Edge sync via Cloudflare Workers in front of GKE for geo-affinity",
        "Chaos engineering + game days quarterly",
        "FinOps council; per-cell unit economics dashboard",
      ],
      monthly_cost_inr_low: 70_00_000,
      monthly_cost_inr_high: 1_50_00_000,
      monthly_cost_usd_low: 84_000,
      monthly_cost_usd_high: 1_80_000,
    },
  ],
  cost_breakdown: [
    { service: "Cloud Run (REST API + AI + Search + Billing)", tier: "growth", unit: "vCPU-s + GB-s", estimated_qty: "~6M req/mo", monthly_inr_low: 18_000, monthly_inr_high: 32_000, notes: "min=1 keeps cold starts low" },
    { service: "GKE Autopilot (sync fleet)", tier: "growth", unit: "vCPU-h + GB-h", estimated_qty: "~4 nodes equiv 24/7", monthly_inr_low: 35_000, monthly_inr_high: 55_000, notes: "Sticky long-lived websockets" },
    { service: "Firestore (multi-region)", tier: "growth", unit: "Reads/Writes/Deletes + GB", estimated_qty: "~120M reads, 40M writes", monthly_inr_low: 22_000, monthly_inr_high: 38_000, notes: "Composite indexes for ACL queries" },
    { service: "Cloud Storage (snapshots)", tier: "growth", unit: "GB-mo + ops", estimated_qty: "1.2 TB, lifecycle to Nearline", monthly_inr_low: 4_000, monthly_inr_high: 8_000, notes: "Versioned bucket" },
    { service: "Memorystore Redis HA", tier: "growth", unit: "GB-h", estimated_qty: "5 GB Standard HA", monthly_inr_low: 14_000, monthly_inr_high: 14_000, notes: "Reserved" },
    { service: "Pub/Sub", tier: "growth", unit: "GB ingress + delivery", estimated_qty: "~250 GB/mo", monthly_inr_low: 6_000, monthly_inr_high: 11_000, notes: "Per workspace topic shards" },
    { service: "BigQuery (analytics + vectors)", tier: "growth", unit: "Storage + on-demand bytes", estimated_qty: "500 GB, ~3 TB scanned", monthly_inr_low: 10_000, monthly_inr_high: 25_000, notes: "Partition by date" },
    { service: "Vertex AI Gemini 2.5 Flash", tier: "growth", unit: "tokens", estimated_qty: "~200M in + 80M out", monthly_inr_low: 8_000, monthly_inr_high: 22_000, notes: "Prompt cache for templates" },
    { service: "Cloud Load Balancer + Armor + CDN", tier: "growth", unit: "forwarding rules + egress", estimated_qty: "~4 TB egress", monthly_inr_low: 6_000, monthly_inr_high: 14_000, notes: "Free CDN tier where applicable" },
    { service: "Cloud Operations (Logging/Tracing/Monitoring)", tier: "growth", unit: "GB ingested", estimated_qty: "~80 GB logs/mo", monthly_inr_low: 2_000, monthly_inr_high: 6_000, notes: "Sample non-error traces" },
  ],
  risks: [
    { id: "r1", title: "Websocket pod restarts drop live sessions", category: "reliability", likelihood: "medium", impact: "high", mitigation: "Graceful drain hook persists awareness state to Redis; client auto-reconnects with last vector clock; CRDT guarantees convergence on reconnect.", cloud_pattern: "Bulkhead" },
    { id: "r2", title: "Hot workspace overwhelms a single sync shard", category: "scalability", likelihood: "medium", impact: "high", mitigation: "Consistent-hash routing with shard rebalancing on threshold breach; pod HPA on connection count.", cloud_pattern: "Sharding" },
    { id: "r3", title: "Snapshot write storms on Cloud Storage", category: "performance", likelihood: "low", impact: "medium", mitigation: "Coalesce snapshots every 30s of inactivity; randomize object keys to spread across colossus partitions.", cloud_pattern: "Queue-Based Load Leveling" },
    { id: "r4", title: "Cross-workspace data leak via mis-scoped query", category: "security", likelihood: "low", impact: "critical", mitigation: "Firestore security rules enforce workspaceId on every read; integration tests cover ACL matrix; quarterly red-team review.", cloud_pattern: "Federated Identity" },
    { id: "r5", title: "DPDP non-compliance for non-Indian customers", category: "compliance", likelihood: "medium", impact: "high", mitigation: "Region-pinned workspaces with explicit data residency choice; export tooling; DPO contact in app.", cloud_pattern: "Geode" },
    { id: "r6", title: "AI feature cost runaway", category: "cost", likelihood: "high", impact: "medium", mitigation: "Per-workspace token budgets; prompt cache; downshift to Flash on long prompts; daily cost alerts.", cloud_pattern: "Throttling" },
    { id: "r7", title: "Pub/Sub backlog on consumer outage", category: "operability", likelihood: "medium", impact: "medium", mitigation: "Dead-letter topic + on-call alert at 5min backlog; consumer auto-scales on subscription depth.", cloud_pattern: "Competing Consumers" },
    { id: "r8", title: "CRDT log corruption on bad client", category: "data-integrity", likelihood: "low", impact: "high", mitigation: "Server-side delta validation; quarantine offending client; replay from last good snapshot.", cloud_pattern: "Quarantine" },
    { id: "r9", title: "Razorpay outage blocks new signups", category: "reliability", likelihood: "low", impact: "medium", mitigation: "Circuit breaker on billing API; allow 7-day grace trial without payment; queue retry via Cloud Tasks.", cloud_pattern: "Circuit Breaker" },
  ],
  security: [
    { area: "identity", control: "MFA mandatory for admins, SSO/SAML for enterprise", implementation: "Identity Platform with MFA + SAML providers; admin SDK enforces MFA claim.", gcp_service: "Identity Platform" },
    { area: "network", control: "All traffic TLS 1.3; private VPC for internal services", implementation: "Serverless VPC Connector for Cloud Run; private Firestore connection; Cloud Armor WAF.", gcp_service: "Cloud Armor + VPC SC" },
    { area: "data", control: "Encryption at rest; CMEK for enterprise tier", implementation: "Default Google-managed keys; opt-in Cloud KMS CMEK on GCS bucket and Firestore.", gcp_service: "Cloud KMS" },
    { area: "secrets", control: "No secrets in env files in prod", implementation: "Secret Manager + Cloud Run secret mounts; auto-rotation for DB creds.", gcp_service: "Secret Manager" },
    { area: "supply-chain", control: "SLSA L3 builds; Binary Authorization", implementation: "Cloud Build attestations; Binary Authorization policy blocks unsigned images on GKE/Cloud Run.", gcp_service: "Binary Authorization + Artifact Registry" },
    { area: "observability", control: "Audit logs to BigQuery; 400-day retention", implementation: "Cloud Audit Logs sink → BigQuery; access via Looker Studio dashboard.", gcp_service: "Cloud Audit Logs" },
    { area: "incident-response", control: "Runbooks + PagerDuty for SEV1", implementation: "SRE runbooks per SLO; PagerDuty rotation; postmortems within 5 business days.", gcp_service: "Cloud Monitoring alerts" },
    { area: "compliance", control: "DPDP Act 2023, SOC 2 Type I in Phase 2", implementation: "Data residency in asia regions; DPA template; audit trail of admin actions.", gcp_service: "Assured Workloads (future)" },
  ],
  observability: {
    metrics: [
      "websocket_connections_active",
      "crdt_delta_ingest_rate",
      "page_load_ms_p95",
      "ai_assist_tokens_per_user",
      "firestore_read_units",
      "snapshot_write_lag_s",
    ],
    logs: [
      "Cloud Run request logs (structured JSON)",
      "GKE sync pod app logs",
      "Firestore audit logs",
      "Razorpay webhook events",
    ],
    traces: [
      "REST API request trace (Cloud Trace + OpenTelemetry)",
      "Sync delta propagation trace",
      "AI assist trace with token counts",
    ],
    slos: [
      { name: "Editor availability", target: "99.95%", window: "rolling 28 days" },
      { name: "WSS sync latency p99", target: "< 80ms in IN", window: "rolling 7 days" },
      { name: "Snapshot durability", target: "100% (RPO=0)", window: "rolling 28 days" },
    ],
    alerts: [
      { name: "Sync pod restart storm", condition: "> 3 restarts in 5min on any pod", severity: "critical" },
      { name: "Firestore read budget breach", condition: "daily reads > 200% of 30d trailing avg", severity: "warning" },
      { name: "AI cost burn", condition: "daily Vertex spend > ₹15,000", severity: "warning" },
      { name: "Pub/Sub backlog", condition: "subscription oldest_unacked_message_age > 5min", severity: "critical" },
      { name: "Razorpay webhook signature failures", condition: "> 5 failures in 10min", severity: "critical" },
    ],
  },
  applied_patterns: [
    { name: "Sharding", category: "Performance", why: "Spread websocket load and CRDT log across many small partitions to avoid hot keys.", where: "Realtime Sync Fleet, Pub/Sub topics" },
    { name: "Event Sourcing", category: "Event-Driven Architecture", why: "CRDT log is the source of truth; metadata and snapshots are projections that can be rebuilt.", where: "Pub/Sub log + Snapshot store" },
    { name: "Cache-Aside", category: "Performance", why: "Avoid Firestore read amplification on hot pages; presence is ephemeral and Redis-native.", where: "Memorystore Redis" },
    { name: "Bulkhead", category: "Reliability & Resilience", why: "Isolate websocket fleet from REST API so a memory leak in one cannot starve the other.", where: "Separate Cloud Run vs GKE workloads" },
    { name: "Circuit Breaker", category: "Reliability & Resilience", why: "Stop hammering Razorpay or Vertex during incidents; fast-fail with a clear user message.", where: "Billing & AI clients" },
    { name: "Throttling", category: "Performance", why: "Per-workspace token and request budgets for AI assist to control unit economics.", where: "AI Assist Service" },
    { name: "Deployment Stamps", category: "Deployment & Operational", why: "At hyperscale, each region runs an independent stamp for blast radius isolation.", where: "Hyperscale tier deployment" },
    { name: "Federated Identity", category: "Security", why: "Trust Google/SSO identity providers; never store passwords.", where: "Identity Platform" },
  ],
  deployment: {
    primary_region: "asia-south1 (Mumbai)",
    additional_regions: ["asia-south2 (Delhi) — read replica"],
    iac: "Terraform with workspace per environment (dev/stage/prod)",
    ci_cd: "Cloud Build → Artifact Registry → Cloud Deploy (canary 5% → 25% → 100%)",
    rollout_strategy: "Canary with automated rollback on SLO burn-rate alert",
    rollback_strategy: "Single-command rollback to previous Cloud Deploy release; Firestore changes guarded behind feature flags via Cloud Config.",
  },
  roadmap: [
    {
      phase: "Phase 1 — MVP",
      timeline: "Weeks 0-8",
      milestones: [
        "Single-region Cloud Run + Firestore + Yjs sync on Cloud Run",
        "Google sign-in, basic ACL, document editor",
        "Razorpay one-time pack purchase",
        "Cloud Monitoring dashboard + 3 SLOs",
      ],
    },
    {
      phase: "Phase 2 — Growth",
      timeline: "Weeks 8-20",
      milestones: [
        "Migrate sync to GKE Autopilot with sticky routing",
        "Multi-region Firestore + asia-south2 read replica",
        "AI Assist with Gemini Flash + prompt cache",
        "Hybrid search (BigQuery vector index)",
        "SOC 2 Type I readiness",
      ],
    },
    {
      phase: "Phase 3 — Scale",
      timeline: "Weeks 20-40",
      milestones: [
        "Shard sync fleet by workspace prefix",
        "Enterprise tier with SSO, CMEK, audit log export",
        "Annual game day; chaos engineering",
        "FinOps dashboard with per-workspace unit economics",
      ],
    },
  ],
  open_questions: [
    "Is offline editing a must-have for Phase 1, or can it slip to Phase 2?",
    "What is the maximum acceptable cost per active editor at the growth tier?",
    "Do we need on-prem / VPC-peered deployments for any anchor customer?",
    "What is the legal & DPO ownership model for DPDP compliance?",
  ],
};
