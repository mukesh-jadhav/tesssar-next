# Tessar — Google Ads & SEO Campaign Playbook

> Positioning: **Tessar is an AI cloud architect.** Describe a system → get a 14-section,
> schema-validated architecture (components, diagrams, monthly cost in ₹, scored risks,
> applied patterns, roadmap). Cloud-agnostic (GCP / AWS / Azure). First design free.
>
> Primary geo: **India** (INR pricing, GST invoices, UPI). Secondary: global English.

This doc is the campaign source of truth. The on-site technical SEO that backs it (sitemap,
robots, JSON-LD, OG image, canonicals, per-page metadata) ships in code — see
`src/lib/seo/*`, `src/app/{robots,sitemap,manifest,opengraph-image,icon}.*`.

---

## 1. Conversion tracking (do this FIRST — ads are blind without it)

Quality Score and bidding both depend on tracked conversions. Set up before spending.

| Event | Where it fires | Use as |
| ----- | -------------- | ------ |
| `sign_up` | After Google sign-in completes (first time) | Primary (micro) conversion |
| `design_started` | `POST /api/architect/generate` success | Secondary |
| `design_completed` | Run reaches `complete` status | Primary (macro) |
| `purchase` | Razorpay verify success (`/api/payments/razorpay/verify`) | Primary (value) — pass `value` in INR + `transaction_id` |
| `study_started` | `POST /api/studies` success | Secondary |

Implementation:
1. Create **GA4** property → mark `purchase`, `design_completed`, `sign_up` as Key Events.
2. Link GA4 ↔ **Google Ads**; import Key Events as Conversions.
3. Add the **Google Ads conversion tag** (gtag) for `purchase` with dynamic `value`/`currency: INR`
   so Smart Bidding can optimize to ROAS, not just clicks.
4. Pass Razorpay `order_id` as `transaction_id` to dedupe.
5. Enable **Enhanced Conversions** (hash the signed-in email) — recovers ~India mobile attribution.

> Recommend a tiny `src/lib/analytics/track.ts` wrapper + `gtag` in `app/layout.tsx`
> (guarded by `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GADS_ID` env vars). I can build this next.

---

## 2. Keyword strategy

Match-type policy: start **Phrase** + **Exact**. Avoid broad until Smart Bidding has ≥30
conversions. Layer broad later with `tCPA` guardrails.

### Ad Group A — AI cloud architecture (core intent)
`"ai cloud architect"`, `"ai cloud architecture"`, `"ai cloud architecture generator"`,
`[ai cloud architect]`, `[cloud architecture generator]`, `"generate cloud architecture"`,
`"ai solution architect"`, `"ai system design tool"`
- **Landing page:** `/` (homepage hero is message-matched to this).

### Ad Group B — Architecture diagrams
`"cloud architecture diagram generator"`, `"aws architecture diagram generator"`,
`"architecture diagram from text"`, `"generate architecture diagram ai"`,
`[architecture diagram generator]`
- **Landing page:** `/sample` (shows the diagrams + full report).

### Ad Group C — Cloud-specific (AWS / GCP / Azure)
`"aws architecture design tool"`, `"gcp architecture design"`, `"azure architecture design"`,
`"aws solution architecture generator"`, `"cloud architecture design tool"`
- **Landing page:** `/` (note Tessar is cloud-agnostic — copy should say "AWS, GCP, or Azure").

### Ad Group D — Cost / planning intent
`"cloud cost estimator"`, `"aws cost calculator alternative"`,
`"cloud infrastructure cost estimate"`, `"monthly cloud cost architecture"`
- **Landing page:** `/sample` (cost section visible) → `/pricing`.

### Ad Group E — Brand (cheap, defensive)
`[tessar]`, `"tessar ai"`, `"tessar cloud architect"`, `[tessar dev]`
- **Landing page:** `/`.

### Negative keywords (campaign-level)
`free` (only if protecting margin — but "first design free" is a hook, so test),
`jobs`, `salary`, `course`, `certification`, `tutorial`, `interview questions`,
`resume`, `wikipedia`, `meaning`, `definition`, `lens` (Tessar = a camera-lens design;
filters photography traffic), `tessar lens`, `zeiss`, `pdf download free`, `crack`,
`github`, `open source`.

---

## 3. Responsive Search Ads (RSA) copy

Pin nothing at first; let Google rotate. Keep ≥11 headlines, 4 descriptions per RSA.
`{KeyWord:Cloud Architecture}` dynamic insertion where natural.

### Headlines (30 chars max each)
1. AI Cloud Architect, On Tap
2. Cloud Architecture in Minutes
3. {KeyWord:AI Cloud Architecture}
4. Brief In, Architecture Out
5. Diagrams, Cost & Risks in ₹
6. First Design Free — No Card
7. AWS, GCP or Azure — One Tool
8. 14-Section Architecture Report
9. From Idea to System Design
10. Board-Ready in ~3 Minutes
11. Senior Architect, On Demand
12. Schema-Validated, Not Vibes
13. ₹300 a Design. No Subscription
14. Export PDF, PPT & Markdown

### Descriptions (90 chars max each)
1. Describe your system. Get components, diagrams, ₹ cost, risks & a roadmap in minutes.
2. Schema-validated cloud architecture across AWS, GCP & Azure. First design free, no card.
3. Skip the blank page. A 14-section, board-ready architecture your engineers will read.
4. ₹300 per design, GST invoice, refunded if a run fails. Credits never expire.

### Assets (extensions)
- **Sitelinks:** See a sample report (`/sample`), Pricing (`/pricing`),
  How it works (`/#how`), FAQ (`/pricing#faq`).
- **Callouts:** First design free · Cost in ₹ · GST invoices · Refund on failure ·
  No subscription · AWS/GCP/Azure · PDF & PPT export.
- **Structured snippets:** *Features* → Diagrams, Cost estimate, Risk scoring,
  Security controls, Roadmap, Patterns.
- **Image assets:** reuse the OG card (`/opengraph-image`) + a diagram screenshot from `/sample`.
- **Call/Lead form:** optional; B2B agencies → lead form asset for "bulk credits".

---

## 4. Campaign structure & settings

- **Campaign 1 — Search (India):** the 5 ad groups above. Network: Search only
  (no Display partners at launch). Locations: India (+ tier-1 metros bid adjustment).
  Language: English. Bidding: **Maximize conversions** → switch to **tCPA** after 30 conv.
- **Campaign 2 — Search (Global English, optional):** Ad Groups A & B only.
  Locations: US, UK, CA, AU, SG, AE. Separate budget so India data isn't diluted.
- **Campaign 3 — Brand:** Ad Group E. Tiny budget, Exact match, near-100% IS target.
- **Budget split (launch):** 70% India / 20% Global / 10% Brand.
- **Schedule:** all-day; review hour-of-day after 2 weeks.
- **Device:** keep mobile (UPI converts on mobile); watch CPA by device.

---

## 5. Landing-page experience (drives Quality Score)

Already shipped in code — message-match is good:
- `/` — hero "Senior cloud architect, on tap" + sample CTA + pricing chips.
- `/sample` — the full real report (diagrams, cost in ₹, risks) = the strongest proof page.
- `/pricing` — ₹300 framing, FAQ (now FAQ rich-snippet eligible), GST/refund trust.

Checklist for QS:
- [x] Fast (Next.js standalone on Cloud Run, `next/font`, no render-blocking).
- [x] Mobile responsive.
- [x] Clear single primary CTA + benefit headline matching ad copy.
- [x] Trust signals: refund-on-failure, GST invoice, "first design free, no card".
- [ ] Add a 20–40s demo/GIF of a run to `/` (recommended — lifts CVR).
- [ ] Add 2–3 named testimonials/logos if available.

---

## 6. Organic SEO foundation (shipped in this change)

| Asset | File | Effect |
| ----- | ---- | ------ |
| `robots.txt` | `src/app/robots.ts` | Crawl public, block app/api/admin/share |
| `sitemap.xml` | `src/app/sitemap.ts` | Submit in Search Console |
| Web manifest | `src/app/manifest.ts` | PWA/install + theme color |
| OG/Twitter card | `src/app/opengraph-image.tsx`, `twitter-image.tsx` | Rich social/link previews |
| Favicon / Apple icon | `src/app/icon.tsx`, `apple-icon.tsx` | Brand in tabs & SERP |
| Organization + WebSite JSON-LD | `src/app/layout.tsx` | Brand entity / sitelinks eligibility |
| SoftwareApplication + Offer JSON-LD | `/`, `/pricing` | Price rich snippet |
| FAQPage JSON-LD | `/pricing` | Expandable FAQ rich result |
| Canonicals + per-page OG | all public pages | No dup-content; clean SERP titles |
| `noindex` | app/login/share routes | Keeps thin/private pages out of index |

### Post-deploy actions (manual, ~30 min)
1. **Google Search Console:** add `tessar.dev`, verify (DNS TXT), submit `sitemap.xml`.
2. **Bing Webmaster Tools:** import from GSC (free extra reach).
3. Validate structured data: [Rich Results Test](https://search.google.com/test/rich-results)
   on `/` and `/pricing` (expect Organization, SoftwareApplication, FAQ).
4. Validate the share card with the Facebook/LinkedIn/X post inspectors.
5. **Google Business / Merchant:** not applicable (digital SaaS) — skip.

### Content/SEO backlog (organic compounding — highest ROI long-term)
Build keyword-targeted resource pages (each = a future ad landing page + organic ranker):
- "AI cloud architecture generator" — pillar explainer.
- "AWS reference architecture for a SaaS" / GCP / Azure variants.
- "How much does it cost to run X on AWS?" — cost-intent, links to `/sample`.
- "System design for [SaaS / marketplace / fintech] in India" — geo + vertical.
- A public gallery of (anonymized, opted-in) sample architectures.

---

## 7. Measurement & iteration

- **Week 1:** verify conversions firing; pause any keyword with >2× target CPC and 0 conv after 100 clicks.
- **Week 2:** add **search-term-report** winners as Exact; add junk as negatives.
- **Week 3–4:** once ≥30 conversions, switch Maximize Conv → **tCPA**; introduce 1 Broad
  test ad group with tCPA cap.
- **North-star:** cost per `design_completed` and per `purchase` (ROAS). Optimize to the
  paid `purchase` once volume allows; until then optimize to `sign_up`/`design_completed`.
- **Guardrail:** watch first-design-free abuse (cost per free run vs paid conversion rate).
