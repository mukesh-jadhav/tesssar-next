import type { DimensionId } from "@/types/study";

/**
 * The five comparison dimensions. Each dimension knows its variants and
 * the constraint snippet to inject into the brief before generation, so
 * the architect agent treats the variant as a hard requirement.
 *
 * See docs/STUDY_PLAN.md §5 for the design rationale.
 */

export interface Variant {
  /** Stable id, used in URLs and the picks payload. */
  id: string;
  /** Column header in the cockpit. */
  label: string;
  /** One-line description shown in the builder. */
  shortBlurb: string;
  /**
   * Single sentence appended to the brief as a hard requirement. Composed
   * with the existing BriefPreferences constraints — they live in the same
   * "Constraints (treat as hard requirements):" block.
   */
  constraint: string;
}

export interface Dimension {
  id: DimensionId;
  label: string;
  description: string;
  variants: Variant[];
}

export const DIMENSIONS: Dimension[] = [
  {
    id: "cloud",
    label: "Cloud",
    description:
      "Compare the same brief built natively on different cloud providers. The cost, ops burden, and lock-in deltas are usually the largest signal.",
    variants: [
      {
        id: "gcp",
        label: "GCP",
        shortBlurb: "Cloud Run, Spanner, Pub/Sub, BigQuery.",
        constraint:
          "Cloud: Google Cloud — design natively on GCP (Cloud Run, GKE Autopilot, Spanner, Firestore, Bigtable, Pub/Sub, BigQuery, Cloud Storage, Cloud CDN, Cloud Armor, Cloud Run Jobs). Use Mumbai (asia-south1) as primary region unless the brief overrides.",
      },
      {
        id: "aws",
        label: "AWS",
        shortBlurb: "ECS/Fargate, Aurora Global, SNS+SQS.",
        constraint:
          "Cloud: AWS — design natively on AWS (ECS Fargate, EKS, Aurora Global Database, DynamoDB Global Tables, ElastiCache, SNS, SQS, EventBridge, Kinesis, S3, CloudFront, WAF). Use Mumbai (ap-south-1) as primary region unless the brief overrides.",
      },
      {
        id: "azure",
        label: "Azure",
        shortBlurb: "Container Apps, Cosmos DB, Service Bus.",
        constraint:
          "Cloud: Azure — design natively on Azure (Container Apps, AKS, Cosmos DB, Azure SQL Hyperscale, Azure Cache for Redis, Service Bus, Event Hubs, Event Grid, Blob Storage, Front Door, WAF). Use Central India as primary region unless the brief overrides.",
      },
      {
        id: "multi",
        label: "Multi-cloud",
        shortBlurb: "Explicit per-cloud responsibilities.",
        constraint:
          "Cloud: Multi-cloud — design with deliberate per-cloud responsibilities (e.g. compute on AWS, data plane on GCP). Call out cross-cloud egress costs, identity federation, and observability fan-in as first-class concerns.",
      },
    ],
  },
  {
    id: "style",
    label: "Architectural style",
    description:
      "Compare how the same problem decomposes under different style commitments. Big velocity and ops differences across phases.",
    variants: [
      {
        id: "monolith",
        label: "Modular monolith",
        shortBlurb: "Single deployable, clear bounded contexts inside.",
        constraint:
          "Architectural style: Modular monolith — one deployable artifact, internal modular boundaries by bounded context, in-process calls between modules. No service-to-service network hops for core flows. Async work in a separate worker process sharing the same codebase.",
      },
      {
        id: "microservices",
        label: "Microservices",
        shortBlurb: "Per-context services, sync RPC + async events.",
        constraint:
          "Architectural style: Microservices — one service per bounded context, sync gRPC/REST between adjacent contexts, async events across the wider system. Each service owns its datastore. Service mesh or API gateway for cross-cutting concerns.",
      },
      {
        id: "serverless",
        label: "Serverless-first",
        shortBlurb: "Functions for compute, managed everything.",
        constraint:
          "Architectural style: Serverless-first — Functions (Cloud Functions / Lambda / Azure Functions) for all custom compute, managed services for everything else, no standing servers, no container orchestration. Eventing via the cloud's native bus.",
      },
      {
        id: "event-driven",
        label: "Event-driven",
        shortBlurb: "Event-sourced backbone, CQRS where it helps.",
        constraint:
          "Architectural style: Event-driven — append-only event log as system-of-record, CQRS for read models, eventual consistency by default, sagas for cross-context workflows. Sync API surface is a thin projection over the event log.",
      },
    ],
  },
  {
    id: "datastore",
    label: "Datastore family",
    description:
      "Compare the same brief built around different primary data engines. Drives data-model, consistency, and ops complexity.",
    variants: [
      {
        id: "sql-primary",
        label: "SQL primary",
        shortBlurb: "PostgreSQL family system of record.",
        constraint:
          "Datastore: SQL primary — a single PostgreSQL-family system of record (Cloud SQL / RDS / Azure Database for PostgreSQL or AlloyDB / Aurora / Azure SQL Hyperscale at higher tiers). Add read replicas before sharding. Use a separate cache and search index, never as the source of truth.",
      },
      {
        id: "nosql-primary",
        label: "NoSQL primary",
        shortBlurb: "Document/KV primary (Firestore/Dynamo/Cosmos).",
        constraint:
          "Datastore: NoSQL primary — document/key-value primary store (Firestore / DynamoDB / Cosmos DB). Single-table or per-aggregate access patterns designed up front. Use a separate relational store ONLY for analytical/reporting needs.",
      },
      {
        id: "newsql",
        label: "NewSQL",
        shortBlurb: "Globally consistent NewSQL (Spanner / Cockroach).",
        constraint:
          "Datastore: NewSQL — globally-consistent horizontally-scalable relational engine (Spanner / CockroachDB). Use it as the system-of-record; partition by tenant or region. Accept the cost premium for the consistency guarantees.",
      },
      {
        id: "polyglot",
        label: "Polyglot",
        shortBlurb: "SQL + document + KV + search, each for its strength.",
        constraint:
          "Datastore: Polyglot persistence — SQL for transactional core, document store for catalogs and configs, KV/cache for sessions and hot reads, dedicated search index for queries. CDC pipeline keeps the projections fresh. Treat each store's data model as a first-class concern.",
      },
    ],
  },
  {
    id: "deployment",
    label: "Deployment model",
    description:
      "Compare how compute is run. Biggest impact on ops headcount and cold-start latency.",
    variants: [
      {
        id: "k8s",
        label: "Kubernetes",
        shortBlurb: "GKE / EKS / AKS for everything.",
        constraint:
          "Deployment model: Kubernetes — GKE Autopilot / EKS / AKS for all custom services. Use Helm charts, namespace-per-environment, HPA + VPA, and a service mesh (Istio / Linkerd) once you have ≥5 services.",
      },
      {
        id: "paas",
        label: "Managed PaaS",
        shortBlurb: "Cloud Run / App Runner / Container Apps.",
        constraint:
          "Deployment model: Managed PaaS — Cloud Run / App Runner / Container Apps for all custom services. Stateless containers, autoscale to zero where it makes sense, traffic split for canary deploys. No Kubernetes.",
      },
      {
        id: "serverless-fn",
        label: "Serverless functions",
        shortBlurb: "Cloud Functions / Lambda / Azure Functions.",
        constraint:
          "Deployment model: Serverless functions — every endpoint and worker is a Function. Cold-start sensitive paths get provisioned concurrency. State lives in managed services only; no in-process state.",
      },
    ],
  },
  {
    id: "cost-posture",
    label: "Cost posture",
    description:
      "Same cloud, different tradeoffs along the cost-vs-resilience axis. The honest 'what would this look like cheap vs. enterprise-hardened' compare.",
    variants: [
      {
        id: "lean",
        label: "Lean MVP",
        shortBlurb: "Single region, manual ops, save 50%.",
        constraint:
          "Cost posture: Lean MVP — single region, smallest viable managed-service tiers, accept manual operational work to halve infrastructure cost. No multi-AZ for non-critical components. Defer DR planning. Optimize for sub-₹50K/mo at startup tier.",
      },
      {
        id: "balanced",
        label: "Balanced",
        shortBlurb: "Multi-AZ, basic DR, standard tiers.",
        constraint:
          "Cost posture: Balanced production — multi-AZ for stateful services, daily backups with documented restore procedure, standard managed-service tiers. Single region but ready to add a passive second region when revenue justifies it.",
      },
      {
        id: "enterprise",
        label: "Enterprise-hardened",
        shortBlurb: "Multi-region active-active, full DR, premium tiers.",
        constraint:
          "Cost posture: Enterprise-hardened — multi-region active-active, full DR with RPO < 5min and RTO < 1hr, premium tiers across the stack, full audit logging retained 7 years, dedicated security perimeter. Accept the 2-3x cost premium for the guarantees.",
      },
    ],
  },
];

export function getDimension(id: DimensionId): Dimension {
  const d = DIMENSIONS.find((dim) => dim.id === id);
  if (!d) throw new Error(`Unknown dimension: ${id}`);
  return d;
}

export function getVariant(dimensionId: DimensionId, variantId: string): Variant {
  const d = getDimension(dimensionId);
  const v = d.variants.find((x) => x.id === variantId);
  if (!v) throw new Error(`Unknown variant ${variantId} for dimension ${dimensionId}`);
  return v;
}
