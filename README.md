# Tessar

> Your AI principal architect. In minutes.

Tessar is a platform for founders and architects: describe the system you want to build in plain English, get a production-grade Google Cloud architecture in minutes — diagrams, scale tiers, cost estimates, risks, security controls, observability plan, applied cloud-design patterns, and a PDF report.

Monetized via INR credit packs (Razorpay). Built entirely on Google Cloud.

---

## Stack

| Concern | Choice |
|---|---|
| Frontend + Backend | **Next.js 14 (App Router, TypeScript)** on **Cloud Run** |
| LLM | **Gemini 2.5 Pro** via **Vertex AI** |
| Auth | **Firebase Auth** — Google sign-in only |
| Database | **Firestore** (Native Mode), `asia-south1` |
| Payments | **Razorpay** (INR) |
| Email | **Resend** (receipts) |
| Diagrams | **Mermaid** (client) — C4, sequence, deployment, ER, data flow |
| PDF | **@react-pdf/renderer** (serverless-friendly) |
| Styling | **Tailwind CSS + shadcn-style primitives** |
| CI/CD | **Cloud Build** → **Artifact Registry** → **Cloud Run** |

---

## Local development

### 1. Prereqs

- Node 20+
- A Google Cloud project with Vertex AI API enabled
- A Firebase project (can be the same as GCP)
- A Razorpay account (test mode works fine)
- A Resend account (optional locally)

### 2. Install

```bash
npm install
cp .env.example .env.local
# Fill in .env.local — see "Environment variables" below
```

### 3. Run

```bash
npm run dev
```

Open <http://localhost:8080>.

> The dev server uses port 8080 to match Cloud Run. Change with `PORT=3000 npm run dev` if you prefer.

---

## Environment variables

See [.env.example](.env.example). Required for full functionality:

**Firebase (client)**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase Admin (server)** — locally only; on Cloud Run use a bound service account instead.
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (newlines escaped as `\n`)

**Vertex AI**
- `GCP_PROJECT_ID`
- `GCP_LOCATION` (default `us-central1`)
- `VERTEX_MODEL` (default `gemini-2.5-pro`)

**Razorpay**
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

**Resend**
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

**App**
- `NEXT_PUBLIC_APP_URL` (e.g. `https://tessar.app`)
- `ADMIN_EMAILS` (comma-separated list of admin emails)

---

## Architecture

```
Browser ──► Cloud CDN / LB ──► Cloud Run (Next.js standalone)
                                ├── /api/auth/session       (Firebase Auth session cookies)
                                ├── /api/architect/generate (SSE — Vertex AI Gemini 2.5 Pro)
                                ├── /api/architect/[id]/pdf (react-pdf)
                                ├── /api/credits/balance
                                ├── /api/payments/razorpay/order
                                ├── /api/payments/razorpay/verify
                                └── /api/payments/razorpay/webhook
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
            Firestore           Vertex AI               Razorpay
       (users, architectures,   (Gemini 2.5 Pro)     (orders + webhook)
        transactions, ledger)
                ▲
                │
            Resend (receipt email)
```

Data model:
- `users/{uid}` — profile, credits, totals
- `architectures/{id}` — prompt, status, generated `Architecture` JSON
- `transactions/{id}` — Razorpay order + payment lifecycle
- `ledger/{id}` — immutable credit grant/consume/refund/purchase entries

---

## The Architect Agent

The agent is a single structured-output call to Gemini 2.5 Pro on Vertex AI with:

1. A deep system prompt encoding **principal-architect methodology**, the **42 cloud-design-pattern canon**, **C4 model**, and an **exact JSON output contract** (~190 lines, see [`src/lib/agent/prompts.ts`](src/lib/agent/prompts.ts)).
2. **JSON mode** (`responseMimeType: "application/json"`) for reliability.
3. **Streaming** of progress events back to the client via Server-Sent Events. The orchestrator detects section markers in the streaming JSON to emit "phase" updates (Analyzing → Selecting components → Designing data flow → …).
4. **Zod validation** of the final JSON against the [`Architecture`](src/types/architecture.ts) schema; on failure, a one-shot "repair" call asks the model to fix it.
5. **Refund on failure** — if the model produces invalid output or errors out, the consumed credit is automatically refunded.

Quality scaffolding the prompt enforces:
- 4 explicit scale tiers (startup / growth / scale / hyperscale) with cost in INR + USD
- ≥6 Mermaid diagrams (C4 Context, C4 Container, Deployment, Sequence, Data Flow, ER)
- ≥8 components, ≥8 tech-stack layers, ≥6 data-flow steps, ≥4 entities
- ≥8 risks across 8 categories, each mapped to a cloud pattern
- ≥8 security controls across 8 security areas
- ≥6 explicitly named cloud-design patterns from the canon

---

## Pricing

| Pack | Credits | Price (INR) | Per-run |
|---|---|---|---|
| Solo Run | 1 | ₹499 | ₹499 |
| Trio | 3 | ₹1,299 | ₹433 |
| Deca | 10 | ₹3,999 | ₹400 |

Plus **1 free credit** on first Google sign-in. Failed runs are auto-refunded.

---

## Deploying to Google Cloud

### One-time setup

```bash
# 1. Set project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  iap.googleapis.com \
  secretmanager.googleapis.com

# 3. Create Artifact Registry repo
gcloud artifacts repositories create tessar \
  --repository-format=docker \
  --location=asia-south1

# 4. Create runtime service account
gcloud iam service-accounts create tessar-runtime \
  --display-name="Tessar Cloud Run runtime"

# 5. Grant Vertex AI + Firestore + Secret Manager access
PROJECT=$(gcloud config get-value project)
for role in roles/aiplatform.user roles/datastore.user roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:tessar-runtime@${PROJECT}.iam.gserviceaccount.com" \
    --role="$role"
done

# 6. Initialize Firestore (Native Mode, asia-south1)
gcloud firestore databases create --location=asia-south1

# 7. Deploy Firestore rules + indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### Push secrets

For each env var in `.env.example` that is not `NEXT_PUBLIC_*`, create a Secret Manager entry. Example:

```bash
echo -n "rzp_live_xxx" | gcloud secrets create tessar-rzp-key-id --data-file=-
```

(Names must match those in [`cloudbuild.yaml`](cloudbuild.yaml).)

### Deploy

```bash
gcloud builds submit --config cloudbuild.yaml
```

This builds the image, pushes it to Artifact Registry, and deploys to Cloud Run at `https://tessar-<hash>-as.a.run.app`. Map your custom domain in the Cloud Run console.

### Razorpay webhook

Once deployed, set your Razorpay webhook URL to:

```
https://<your-domain>/api/payments/razorpay/webhook
```

Subscribed event: `payment.captured`. Use the secret you stored in `tessar-rzp-webhook-secret`.

---

## Project layout

```
src/
  app/
    (app)/                    — authenticated routes (dashboard, new, history, pricing, admin)
    api/                      — route handlers (auth, architect, payments, credits, admin)
    sample/                   — public sample report
    legal/                    — terms, privacy
    login/                    — Google sign-in
    page.tsx                  — public landing
  components/
    architecture/             — ArchitectureView, MermaidDiagram, ScaleExplorer, NewArchitectureForm
    auth/                     — GoogleSignInButton
    billing/                  — CreditPacksGrid
    shared/                   — AppHeader, Footer, Logo
    ui/                       — Button, Card, Tabs, Slider, Progress, …
  lib/
    agent/                    — Architect orchestrator + system prompt
    credits/                  — Ledger (atomic grant/consume/refund)
    email/                    — Resend receipt
    firebase/                 — Client + Admin SDK + session cookie helpers
    pdf/                      — react-pdf report
    razorpay/                 — Server client + INR pack definitions
    samples/                  — Hand-crafted sample architecture for landing page
    vertex/                   — Vertex AI client
  types/
    architecture.ts           — Zod schemas + Firestore doc types
```

---

## License

Proprietary. © Tessar.
