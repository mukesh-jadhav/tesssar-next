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

## Phase 1 — Landing page (`/`)  ✅ SHIPPED

### 1.1 Hero motion
- [~] **Wordmark + headline reveal** — DEFERRED to Phase 10 (kept existing `m3-page-enter` for now; clip-path reveal would replace it).
- [x] **Headline italic accent (`on tap.`)** — drawn-underline (`DrawnUnderline`) paints in 600ms after headline lands.
- [x] **Hero stat row count-up** — `HeroStats` ticks `14`, `6+`, `42`, `₹300` from 0 on viewport entry (1.8s, `en-IN` locale).
- [x] **Ambient diagram in negative space** — `AmbientDiagram` SVG (5 nodes, dashed bezier wires, travelling accent dots, slow breathing pulse) at `lg:` opacity-55 / `xl:` opacity-65, hidden on mobile.
- [x] **Primary CTA** — wrapped in `MagneticCTA` (strength 0.22, maxDistance 10px). Ripple on click DEFERRED.
- [x] **Scroll-progress line** — `ScrollProgress` (2px accent, top-fixed).

### 1.2 "How it works" 3-step grid
- [x] **Tiny visuals per step** — `StepVisual` with `kind="describe"` (textarea + blinking caret), `kind="design"` (3-node mini-arch with drawn wires), `kind="ship"` (3 fanning doc chips MD/PPTX/PDF).
- [~] **Stagger reveal of all three on scroll-in** — DEFERRED to Phase 10 (currently all three lift as one block via `scroll-reveal`).

### 1.3 Feature grid (`What you get`)
- [~] **Break the uniform 3×3 grid (span-2 rich cells)** — DEFERRED. Hairline grid (`gap-px bg-line`) and rich span-2 cells need a structural refactor; tracked as sub-phase 1.3b.
- [x] **Card hover treatment** — chose CSS-only over `<Tilt>` (tilt would expose hairline through rotated corners): top accent rail draws in 500ms ease-out-expo on `group-hover`, icon scales 1.12 + accent color shift, title accent-ink shift, bg paper→card.
- [~] **Stagger entry on scroll-into-view** — DEFERRED to Phase 10 (currently grid lifts as one block via `scroll-reveal`).

### 1.4 Quote section
- [x] **Rotating set of 3 quotes** — `RotatingQuotes` auto-cycles every 7s, AnimatePresence crossfade+slide (480ms ease-out-expo), pause-on-hover/focus, progress-dot tab strip.
- [~] **Avatar circle scale on quote change** — n/a (current design has no avatar circle); progress-dot width animation serves the same beat.
- [~] **Oversized italic vermillion quote-mark with parallax** — DEFERRED (depends on dropping current ink-band background).

### 1.5 Sample CTA
- [~] **Replace right-column stat list with cropped screenshot** — DEFERRED (needs actual screenshot asset; tracked separately).
- [x] **Cursor-proximity tilt** — `TiltCard` (max 4°, perspective 1000) wraps the right `card-paper`.
- [x] **`Open the sample` arrow slides 4px on hover** — `group-hover:translate-x-1` on the `MagneticCTA` arrow.

### 1.6 Pricing teaser strip
- [x] **4 pack chips** — `PricingChips` renders Solo ₹300 / Trio ₹840 / Sprint ₹2,500 / Studio ₹10,000, each links `/pricing#{slug}`.
- [x] **Trio chip scaled + accent ring** — Trio at `scale-1.04` with `ring-1 ring-[hsl(var(--accent))]`.
- [x] **Hover: chip lifts** — `whileHover y:-3` via framer.

### 1.7 Final CTA section
- [~] **Differentiated framing (smaller headline, full-bleed dark band, single button)** — DEFERRED (current section is already distinct enough; full redesign deferred).
- [x] **Primary CTA as Magnetic** — `MagneticCTA` (variant=accent, size=lg).
- [~] **Background paper-grain parallax** — DEFERRED to Phase 10.

### 1.8 Section transitions
- [x] **Section content reveal on scroll** — `scroll-reveal` CSS class (modern `animation-timeline: view()`) applied to 6 section content blocks. Modern Chrome/Edge animate (`section-reveal-rise` 900ms cubic-bezier expo-out, range entry 5% → cover 28%); Safari/Firefox degrade gracefully to static. Respects `prefers-reduced-motion`.
- [~] **Rule-dots draw left-to-right on viewport entry** — DEFERRED to Phase 10 (needs clip-path animation primitive).

### Phase 1 motion primitives shipped (in addition to plan)
- `src/components/landing/AmbientDiagram.tsx`
- `src/components/landing/DrawnUnderline.tsx`
- `src/components/landing/HeroStats.tsx`
- `src/components/landing/MagneticCTA.tsx`
- `src/components/landing/RotatingQuotes.tsx`
- `src/components/landing/TiltCard.tsx`
- `src/components/landing/StepVisual.tsx`
- `src/components/landing/PricingChips.tsx`
- `.scroll-reveal` CSS-only scroll-driven reveal in `globals.css`

### Phase 1 deferred work (rolled into Phase 10 polish or sub-phases)
- 1.1 wordmark/headline clip-path reveal
- 1.2 / 1.3 per-card stagger entry (currently whole-section reveal)
- 1.3b feature grid asymmetric span-2 rich cells
- 1.4 oversized quote-mark parallax
- 1.5 actual sample screenshot asset
- 1.7 final CTA full-bleed differentiation
- 1.7 paper-grain background parallax
- 1.8 rule-dots draw-in animation

---

## Phase 2 — Pricing page (`/pricing`)

- [x] **2.1 Promote Trio card** — accent top stripe, lg lift via shadow + z-10, larger price clamp on popular.
- [x] **2.2 Comparison matrix** below the four cards — designs, per-design price, bulk discount, full report, PDF, history, refund, no expiry, GST invoice; popular column highlighted dark.
- [x] **2.3 FAQ accordion** — 8 items, Framer `layout` + AnimatePresence height spring, `+` chevron rotates to × on open, reduced-motion safe.
- [x] **2.4 Bulk-credits CTA dressed up** — second accent blur orb, fuller copy, Magnetic + arrow slide on the primary button.
- [x] **2.5 Card hover motion** — `<Tilt max={2}>` wrapper + group-hover price scale (1.025) + arrow translate-x.
- [x] **2.6 "Free first design" badge** with hand-drawn underline (reused `DrawnUnderline`) anchored to the Solo card, drawing in on scroll.

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

> **Structural note:** The cockpit (`ReportCockpit`) is a **tabbed in-app surface**, not a long-form scroll page. Items that assumed long-form scroll (scroll-progress through report, parallax chapter numerals, sticky mini-TOC sidebar, scroll indicator between hero and first chapter) do not apply; their **equivalent in a tabbed surface** is the sliding chapter-tab indicator + chapter cross-fade transitions, which are shipped. The cockpit drives `/architecture/[id]`, `/sample`, and `/r/[slug]`.

### 5.1 Navigation — Phase 5A shipped (adapted to tabbed surface)
- [x] **Sliding chapter-tab indicator** — `framer-motion layoutId="cockpit-chapter-indicator"` spring-slides a 2px accent bar between active tabs (replaces per-tab `border-b-2`). Equivalent of "progress bar" in a tabbed surface.
- [x] **Chapter cross-fade transitions** — `<AnimatePresence mode="wait">` around the entire canvas content keyed on chapter; content fades+rises 14→0 / fades+exits 0→-8 over 340ms ease-out-expo.
- [x] **`Up next →` affordance** — already present as `ChapterFooter` with prev/next cards (kept).
- [~] **Sticky mini-TOC sidebar on xl:** — N/A on tabbed surface (right inspector serves the contextual role; chapter tabs serve as TOC).
- [~] **Chapter numeral parallax** — N/A (no scroll-driven hero numerals in tabbed cockpit).

### 5.2 Diagrams tab — Phase 5A partially shipped
- [x] **Segmented control with animated pill** — `layoutId="cockpit-diagram-segmented-pill"` slides a solid ink pill between diagram kinds.
- [x] **Diagram tab-switch transition** — `<AnimatePresence mode="wait">` keyed on `current.id`: fade+rise 8→0 / exit 0→-6 over 320ms ease-out-expo.
- [~] **Diagram thumbnail strip** — DEFERRED to Phase 5B (needs SVG snapshot pipeline).
- [~] **Fullscreen diagram modal** — DEFERRED to Phase 5B (EditorialDiagram already has zoom/pan; modal wrapper is incremental).
- [~] **Per-diagram download SVG/PNG buttons** — DEFERRED to Phase 5B.
- [~] **Node hover neighbor dimming** — DEFERRED to Phase 5B (requires EditorialDiagram graph-traversal work).
- [~] **Minimap & legend** — DEFERRED to Phase 5B.

### 5.3 Components tab — Phase 5A shipped
- [x] **Filter pills at top** with animated sliding indicator — `All / Frontend / Backend / Data / Platform`, each shows live count, `layoutId="cockpit-pieces-filter-pill"` springs a soft paper-2 pill between active states. Filter buckets defined by `COMPONENT_FILTERS` regex map over the 15 ArchComponent categories.
- [x] **Card entry stagger on filter change** — `<AnimatePresence mode="popLayout">` re-animates the grid as the filter narrows; each card lifts 8→0 over 280ms with capped 25ms stagger (max delay 180ms).
- [~] **Visual cluster headers** — DEFERRED (filter pills serve the same discovery role without breaking the hairline grid).
- [~] **Cross-section linking (card hover pulses diagram nodes)** — DEFERRED to Phase 5B (needs shared selection-effect channel).

### 5.4 Cost breakdown — Phase 5A shipped
- [x] **Inline horizontal bar per row** — `CostBreakdown` component; each row's bar animates 0→width on viewport entry over 850ms ease-out-expo with 40ms per-row stagger. Bar sized by `midpoint(low, high) / max(midpoint)`.
- [x] **Total row with count-up** — sums all midpoints; `<CountUp to={total} duration={1.6}>` with Indian numbering; shows `≈ ₹X` plus full low–high band.
- [x] **Per-row share %** column shows the row's contribution to total.
- [x] **Hover row** — bg shifts to `paper-2/40` on hover.

### 5.5 Risk register — Phase 5A shipped
- [x] **Risk matrix heatmap** above list — `RiskMatrix` 4 impact rows × 3 likelihood cols (matches actual zod enums: impact = low/medium/high/critical, likelihood = low/medium/high). Cell background heat-tinted by `accent / heat * 0.16`.
- [x] **Click matrix dot → scroll to list entry + select** — `cockpit-risk-{id}` anchors; `scrollIntoView({ behavior: "smooth", block: "center" })`; selection also drives inspector.
- [x] **Selected dot highlight** — current selection scales 1.5 + accent ring with paper offset.
- [~] **Toggle: matrix view ↔ list view** — DEFERRED (showing both at once is more useful than toggling; can revisit).

### 5.6 Scale profiles tab
- [~] **Comparative table refactor** — DEFERRED to Phase 5B. Current `ScaleExplorer` (a separate 161-line component) already lays out tiers; comparative-table redesign needs its own pass.

### 5.7 Roadmap — Phase 5A shipped
- [x] **Phase cards stagger reveal on viewport entry** — each phase card lifts 12→0 over 500ms ease-out-expo with capped 80ms stagger (max delay 400ms).
- [x] **Left accent rail draws in per card** — vertical accent line `scaleY: 0→1` over 700ms with `transformOrigin: top`, delayed 150ms after card lands.
- [x] **Milestones fade-slide in with secondary stagger** — each milestone x:-6→0 + fade over 400ms with 50ms per-milestone stagger.
- [~] **Horizontal swim-lane timeline** — DEFERRED (vertical phase cards with motion deliver the "drawing" feel without the horizontal-overflow problem in a bounded cockpit canvas).

### 5.8 Cockpit hero — Phase 5A shipped
- [x] **Lead paragraph word-by-word fade** — `WordFade` splits the lead sentence, each word fades+lifts+unblurs over 460ms with 45ms stagger (50ms base delay). Reduced-motion users see the static sentence.
- [~] **`↓ the work` scroll indicator** — N/A on tabbed surface; user clicks chapter tabs.

### Phase 5A summary
- 4 new cockpit-local primitives in `src/components/workspace/ReportCockpit.tsx`: `WordFade`, `FilterPills<T>`, `CostBreakdown`, `RiskMatrix`.
- All animations honor `useReducedMotionSafe()`; bars and word-fade degrade to final state.
- Bundle impact: `/r/[slug]` 185 → 237 kB First Load (framer-motion + layout). `/sample` 178 → 231 kB.
- Phase 5B (deferred): diagram thumbnail strip, fullscreen modal, node neighbor-dimming, minimap, legend, per-diagram SVG/PNG download, components↔diagram cross-linking, scale profiles comparative table, horizontal roadmap timeline.

---

## Phase 6 — App shell, global, navigation

### Phase 6A shipped

- [x] **6.1 Unified persistent shell** — `AppHeader` (already global) gains a centered breadcrumb slot (`HeaderBreadcrumb`) that resolves the pathname into editorial crumbs. Confirmed persistent across `/dashboard`, `/new`, `/history`, `/architecture/[id]`, `/r/[slug]`, `/pricing`, `/sample`, `/studio`, `/admin`.
- [x] **6.2 cmd+k command palette** — already shipped (`CommandMenu` with Radix Dialog, fuzzy filter, group sections, kbd hints, arrow nav).
- [x] **6.3 Keyboard shortcuts** — `GlobalShortcuts` mounted in root layout. `g d/n/h/p/s` sequence with 900ms reset window, `?` opens help overlay, suppressed inside editable fields, never collides with modifier-key combos.
- [x] **6.4 Help overlay** — `HelpOverlay` Radix Dialog with three-section cheat-sheet (Navigate / Search & help / Inside a report), animated kbd glyphs, opens on `?` window event, also reachable from mobile drawer.
- [x] **6.5 Mobile hamburger drawer** — `MobileNavMenu` (md:hidden) opens a right sheet (300ms slide-from-right, blurred overlay backdrop), groups Workspace + Explore links, deep links into Help. Auto-closes on route change.
- [x] **6.6 Route transitions** — `src/app/template.tsx` Framer 280ms opacity + 8px upward translate on every route change. Composes cleanly with section-level `m3-page-enter` springs.
- [x] **6.7 Toast positioning** — `<Toaster position="top-center" />` globally (was top-right). Reads naturally above content; doesn't compete with cockpit chrome.
- [x] **6.9 Cursor accent** — `CursorAccent` 12px vermillion ring trails the pointer with rAF-lerp on `/` and `/sample`. Gated behind reduced-motion, coarse pointer, and narrow viewport. `mix-blend-multiply` keeps it readable on both paper and ink surfaces.

### Phase 6B (deferred)

- [ ] **6.8 Page-load skeletons** — every route gets a suspense boundary with shape-matching skeletons (foundation `src/components/skeleton/*` already exists; needs per-route `loading.tsx` files with the right column shapes).

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
