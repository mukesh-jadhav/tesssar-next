# Tessar — UI, Layout & Motion Plan

Living document. We work top-to-bottom in phases. Tick boxes as we ship.

**North-star:** Tessar should feel like a piece of editorial software — confident, alive, and quietly opinionated. Every surface should reward attention. Nothing should look static when it could breathe.

**Tone constraints (do not break):**
- No emojis in product UI.
- No marketing fluff.
- Editorial typography, monochrome paper aesthetic + vermillion accent.
- Indian-rupee first, Indian-English copy.
- Motion is purposeful, never decorative. Always respect `prefers-reduced-motion`.

---

## Phase 0 — Foundations (do these first; everything else depends on them)

These are infrastructure for the rest of the plan. Ship before any feature-level UI work.

- [x] **0.1 Install motion primitives** — add `framer-motion` (or `motion`, the lighter v11 fork). Already have CSS transitions; we need spring + scroll-linked motion + layout animations.
- [x] **0.2 Build a `Motion` module** at `src/components/motion/`:
  - `<FadeIn>` — fade + 12px upward translate on viewport entry, 600ms ease-out, 80ms stagger via parent.
  - `<Reveal>` — clip-path reveal for headlines (mask-based, not opacity).
  - `<Stagger>` + `<StaggerItem>` — parent that staggers children by configurable delay.
  - `<CountUp>` — number ticker for stats (ease-out, 1.6s, locale-aware separators, `en-IN` default).
  - `<Magnetic>` — buttons subtly follow cursor within 12px radius.
  - `<Tilt>` — cards tilt 4° on hover (perspective wrapper).
  - `<ScrollProgress>` — top-of-page line that fills as user scrolls.
  - `<Parallax>` — translates child on Y based on scroll position.
  - All primitives short-circuit when `prefers-reduced-motion: reduce` via `useReducedMotionSafe`.
- [x] **0.3 Motion tokens** in `tailwind.config.ts`:
  - Durations: `duration-instant 80ms`, `duration-fast 180ms`, `duration-base 280ms`, `duration-slow 480ms`, `duration-cinematic 800ms`.
  - Easings: already present in CSS as `--ease-out-quart`, `--ease-out-expo`, `--ease-spring`, `--ease-soft-spring`, plus M3 named set in tailwind config.
  - Stagger: `delay-stagger-sm 40ms`, `delay-stagger 80ms`, `delay-stagger-lg 120ms`.
- [x] **0.4 Global focus-visible audit** — fixed broken `border-radius: 4px` on outline rule; `outline` now follows element's natural border-radius. 2px accent ring at 2px offset.
- [x] **0.5 Skeleton primitives** at `src/components/skeleton/` — `<Skeleton>` (base), `<SkeletonText>`, `<SkeletonCard>`, `<SkeletonDiagram>` (with faux nodes + dashed wires), all using global `animate-shimmer` keyframe.
- [x] **0.6 Dark-mode token shelf** — `[data-theme="dark"]` block staged in `globals.css`; tokens defined but not wired to `<html>` yet. Flip `data-theme="dark"` to preview.
- [x] **0.7 Print stylesheet** — `@media print` block: hides nav/aside/footer, expands details, fits diagrams, breaks-inside avoid on cards/tables, page margins 18mm/14mm, `print-color-adjust: exact`.
- [x] **0.8 Reduced-motion media query** — global `@media (prefers-reduced-motion: reduce)` block kills all CSS animations + transitions; complements per-primitive `useReducedMotionSafe` short-circuits.

---

## Phase 1 — Landing page (`/`)

### 1.1 Hero motion
- [ ] **Wordmark + headline reveal** — clip-path-based reveal, 90ms stagger between words, 800ms.
- [ ] **Headline italic accent (`on tap.`)** — drawn-underline that paints in 600ms after headline lands.
- [ ] **Hero stat row count-up** — `14`, `6+`, `42`, `₹300` tick from 0 on viewport entry.
- [ ] **Ambient diagram in negative space** — slow-drifting editorial mini-architecture diagram on the right of headline at `lg:` breakpoint. Nodes pulse subtly (4s breathing), wires shimmer. Not interactive. Adds life without distraction.
- [ ] **Primary CTA `Start your first design`** — `<Magnetic>` wrapper + 60ms ripple on click.
- [ ] **Scroll-progress line** at very top of viewport (1px accent, fills as user scrolls page).

### 1.2 "How it works" 3-step grid
- [ ] **Replace plain text bodies with tiny visuals:**
  - Step 1 — textarea silhouette with caret blinking.
  - Step 2 — streaming-text animation that resolves into a 3-node diagram.
  - Step 3 — stack of three document chips (PDF/PPTX/MD) that fan out on hover.
- [ ] **Stagger reveal** of all three on scroll-in (120ms between steps).

### 1.3 Feature grid (`What you get`)
- [ ] **Break the uniform 3×3 grid.** Promote 3 cells to span 2:
  - `System diagrams` — embed actual mini SVG diagram (5 nodes, animated wires).
  - `Pattern library` — chip cloud of 42 pattern names that gently float.
  - `PDF · PPTX · Markdown` — three layered document corners with hover separation.
- [ ] Remaining 6 cells stay 1×1 text + icon.
- [ ] **Card hover** — `<Tilt>` 3° + accent border fade-in (180ms).
- [ ] **Stagger entry** on scroll-into-view, 80ms.

### 1.4 Quote section
- [ ] **Replace single Priya R. quote with rotating set of 3 quotes** — auto-cycle every 7s, fade+slide transition (480ms). Crossfade, not pop.
- [ ] **Avatar circle** scales 1 → 1.05 on quote change (320ms spring).
- [ ] **Quote-mark glyph** (oversized italic vermillion `"`) floats in top-left of quote, parallax 0.3.

### 1.5 Sample CTA
- [ ] **Replace right-column stat list with an actual cropped screenshot** of the sample report — diagram + heading + part of cost table.
- [ ] **Screenshot tilts subtly on cursor proximity** (perspective wrapper).
- [ ] **`Open the sample` button** with arrow that slides 4px on hover.

### 1.6 Pricing teaser strip
- [ ] **Add 4 pack chips** below pricing copy: `Solo ₹300 · Trio ₹840 · Sprint ₹2,500 · Studio ₹10,000`.
- [ ] Trio chip scaled 1.05 + accent ring (`Most popular`).
- [ ] Hover: chip lifts 4px with shadow.

### 1.7 Final CTA section
- [ ] **Differentiate from hero** — smaller headline, full-bleed dark band, single primary button.
- [ ] **Background paper-grain shifts** slowly (8s loop, parallax 0.4 on scroll).

### 1.8 Section transitions
- [ ] Every section divider — paper-grain seam that reveals on scroll.
- [ ] Long horizontal `rule-dots` should draw left-to-right when entering viewport (800ms).

---

## Phase 2 — Pricing page (`/pricing`)

- [ ] **2.1 Promote Trio card** — `lg:scale-105`, thicker top accent border, slightly larger headings.
- [ ] **2.2 Comparison matrix** below the four cards — rows = features (designs, refund-on-fail, expiry, GST invoice, team seats, priority queue), columns = packs, check/dash glyphs.
- [ ] **2.3 FAQ accordion** — 6-8 items minimum, smooth height animation (Framer `layout`), accent chevron rotates on open.
- [ ] **2.4 Bulk-credits CTA dressed up** — dark band, sentence about team workflow, primary button with arrow.
- [ ] **2.5 Card hover motion** — `<Tilt>` + price number subtle scale 1.02.
- [ ] **2.6 "Free first design" badge** with hand-drawn underline that draws on scroll-into-view.

---

## Phase 3 — Login page (`/login`)

- [ ] **3.1 Rotating testimonials** — 3 quotes, auto-cycle every 7s, crossfade.
- [ ] **3.2 Mini dashboard preview** below the Google button — 3-row miniature of what they'll see after sign-in.
- [ ] **3.3 Back link** to `/` (top-left, `← tessar.dev`, subtle).
- [ ] **3.4 Google button** — `<Magnetic>` + Google-G icon that subtly rotates on hover (12°, 320ms).
- [ ] **3.5 Sign-in success transition** — fade-out + accent paint sweep before route change.
- [ ] **3.6 Aside scroll-parallax** — quote drifts up at 0.4× scroll rate.

---

## Phase 4 — Composer (`/new`)

- [ ] **4.1 Left rail with last 3 briefs** — ghost cards, "Restart this brief" / "Use as template" on hover.
- [ ] **4.2 Empty-state coaching** — when textarea empty + unfocused >3s, fade in inline prompt "Not sure where to start? Build it together →" linking to GuidedBriefDialog.
- [ ] **4.3 Word counter** at textarea bottom-right — subtle, shows `230 words · ideal 200-400`, color shifts as user approaches ideal range.
- [ ] **4.4 Submit button label upgrade** — `Generate · 40 credits` primary + sub-line `~3 min · refunded on failure`.
- [ ] **4.5 Textarea focus animation** — border accent fade + subtle inner glow (180ms).
- [ ] **4.6 GuidedBriefDialog open animation** — dialog scales from 0.96 + fades in, 280ms spring-soft.
- [ ] **4.7 Submit-pressed transition** — button morphs into a horizontal progress bar that fills as the agent streams (Framer `layout`).

---

## Phase 5 — Report cockpit (the live read view) — biggest surface, most impact

### 5.1 Navigation
- [ ] **Progress bar across top** showing read-position through the report (sticky, 2px accent fill).
- [ ] **`next chapter →` affordance** at end of each chapter (centered, with paper-grain divider above).
- [ ] **Sticky mini-TOC sidebar** on `xl:` screens — chapter list on the right, current chapter highlighted, smooth scroll on click.
- [ ] **Chapter numeral parallax** — the giant `01`, `02` numerals translate at 0.6× scroll rate.

### 5.2 Diagrams tab
- [ ] **Replace tag-style buttons with proper segmented control** — filled active state, chevron, animated underline that slides between selections (Framer `layoutId`).
- [ ] **Diagram thumbnail strip** below tabs — small SVG previews, horizontally scrollable, current diagram highlighted.
- [ ] **Fullscreen diagram modal** — click any diagram → max-vh modal with existing zoom/pan. Esc closes, animated.
- [ ] **Per-diagram download SVG/PNG buttons** in top-right of diagram chrome.
- [ ] **Node hover** — 1-degree neighbors highlight (full opacity), rest dim to 25%, 180ms. Wires connecting them brighten.
- [ ] **Minimap** in bottom-right corner of large diagrams (>30 nodes) — 120×80px overview with viewport rectangle, draggable.
- [ ] **Legend** in bottom-left — what each shape means (component, service, datastore, external).
- [ ] **Diagram tab-switch transition** — current diagram fades + slides out, new one fades + slides in (320ms).

### 5.3 Components tab
- [ ] **Cluster by category visually** — frontend / api / service / data with thin section separators and category headers.
- [ ] **Card hover** — lifts 4px + accent border + the related diagram nodes pulse (cross-section linking).
- [ ] **Filter pills at top** — `All · Frontend · API · Service · Data`, animated underline.

### 5.4 Cost breakdown
- [ ] **Inline horizontal bar in each row** — relative weight against total monthly cost. Bar animates from 0 → width on viewport entry (800ms ease-out-expo).
- [ ] **Total row** — number counts up.
- [ ] **Hover row** — bar saturates, row background tints (paper-2 → paper-3).

### 5.5 Risk register
- [ ] **5×5 risk matrix heatmap** above the list — likelihood × impact, dot per risk, click to scroll to list entry.
- [ ] **Toggle: matrix view ↔ list view** (segmented control).
- [ ] **List row hover** — highlights matching matrix dot.

### 5.6 Scale profiles tab
- [ ] **Comparative table** instead of 4 side-by-side cards — rows = attributes (MAU, RPS, components, monthly cost, regions), columns = tiers (startup / growth / scale / hyperscale).
- [ ] **Cell hover** — cross-highlights row and column.
- [ ] **Delta indicators** between adjacent tiers (`+3 components`, `+₹45,000/mo`).

### 5.7 Roadmap
- [ ] **Horizontal timeline** — swim lanes by phase, milestones as nodes on the lane.
- [ ] **Hover milestone** — tooltip with details.
- [ ] **Animated drawing** — lanes draw left-to-right on viewport entry, milestones pop in with stagger.

### 5.8 Cockpit hero
- [ ] **Scroll indicator** between hero and first chapter (small `↓ the work` chip).
- [ ] **Lead paragraph fades in word-by-word** (60ms stagger, 480ms each).

---

## Phase 6 — App shell, global, navigation

- [ ] **6.1 Unified persistent shell** across `/dashboard`, `/new`, `/history`, `/r/[slug]` — left wordmark, center breadcrumb, right credits + profile.
- [ ] **6.2 cmd+k command palette** — fuzzy-search architectures, jump to dashboard / new / history / pricing, recent briefs. Built on `cmdk` or custom.
- [ ] **6.3 Keyboard shortcuts** — `g h` (history), `g d` (dashboard), `g n` (new), `?` (help overlay).
- [ ] **6.4 Help overlay** — pressing `?` shows a styled keyboard cheat-sheet.
- [ ] **6.5 Mobile hamburger drawer** — slides in from right (320ms spring-snappy), backdrop fades in.
- [ ] **6.6 Route transitions** — every route change does a 280ms crossfade + 8px upward translate. Use Next.js template + Framer.
- [ ] **6.7 Toast positioning** — Sonner top-center on architecture-generation success (user reads result, not corner).
- [ ] **6.8 Page-load skeletons** — every route gets a suspense boundary with shape-matching skeletons.
- [ ] **6.9 Cursor accent** — on `/` and `/sample`, a 12px accent ring follows cursor with 80ms lag (decorative, gated behind reduced-motion).

---

## Phase 7 — Empty states & first-run

- [ ] **7.1 First-time `/dashboard`** — editorial line illustration + "Your workspace is empty. Start your first design →".
- [ ] **7.2 First-time `/history`** — same treatment.
- [ ] **7.3 Zero-credits state on `/new`** — clear ladder to `/pricing` with the 4 packs preview.
- [ ] **7.4 Failed-architecture state** — clean error illustration + "Refunded · try again" + the brief pre-filled.

---

## Phase 8 — Footer & trust

- [ ] **8.1 4-column footer** — Product / Resources / Company / Connect.
- [ ] **8.2 `Status: All systems operational` indicator** with green dot (footer-right).
- [ ] **8.3 Copyright + craft line** — `Designed in India. Hosted on Google Cloud asia-south1.`

---

## Phase 9 — Visual design system cleanup

- [ ] **9.1 Consolidate heading scales** — audit `display-tight` / `display` / `serif italic` usage, settle on 2 scales max.
- [ ] **9.2 Demote accent overuse** — vermillion in italic spans + buttons + dots + underlines is too much. Drop the dots to `ink-3`.
- [ ] **9.3 Dark mode** — proper paper↔ink swap, accent slightly desaturated. Toggle in footer + respects `prefers-color-scheme` by default.
- [ ] **9.4 Selective grain** — keep on `/`, `/pricing`, `/login`, `/sample`. Remove from `/dashboard`, `/r/[slug]`, `/new` (data-dense surfaces).
- [ ] **9.5 Audit shadow tokens** — currently mixed. Settle on 3: `shadow-paper-sm` (cards), `shadow-paper-md` (modals), `shadow-paper-lg` (dialogs).

---

## Phase 10 — Motion polish pass (do last, applies everywhere)

- [ ] **10.1 Page-enter** — every section/card uses `<FadeIn>` from Phase 0.
- [ ] **10.2 Hover-anywhere** — every interactive surface has a hover state with motion.
- [ ] **10.3 Scroll-driven** — every long section has at least one scroll-linked animation.
- [ ] **10.4 Loading states** — every async boundary shows skeleton + shimmer.
- [ ] **10.5 Micro-interactions** — copy-to-clipboard pulse, save-success checkmark draw, credit-deducted number animation.
- [ ] **10.6 Audit `prefers-reduced-motion`** — every primitive in Phase 0 short-circuits cleanly. Test with OS toggle.
- [ ] **10.7 Performance pass** — no animation over 60fps cost; use `transform` + `opacity` only; `will-change` strategically; avoid layout thrash.

---

## Execution order (recommended)

1. **Phase 0** — foundations (1-2 days)
2. **Phase 1** — landing (highest visibility; first impressions)
3. **Phase 5** — cockpit (where users spend the most time)
4. **Phase 2** — pricing (revenue surface)
5. **Phase 6** — global shell (cmd+k, route transitions — makes everything feel snappier)
6. **Phase 3** — login
7. **Phase 4** — composer
8. **Phase 7** — empty states
9. **Phase 8** — footer
10. **Phase 9** — design system cleanup
11. **Phase 10** — motion polish pass (final coat across the whole app)

---

## Working agreement

- One phase at a time. Don't open Phase 2 work until Phase 1 has shipped.
- Each phase ends with a single commit + deploy + brief verification on tessar.dev.
- Update this file (tick boxes) at the end of each phase.
- If a checklist item turns out to be wrong or unnecessary, strike it through and note why — don't silently drop it.
- If something not on this list comes up while building, add it as a new bullet in the relevant phase before doing it.
