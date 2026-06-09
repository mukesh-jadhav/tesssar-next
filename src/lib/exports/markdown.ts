import "server-only";

import type { Architecture } from "@/types/architecture";
import { SCALE_TIER_META } from "@/types/architecture";

/**
 * Renders an Architecture as a polished Markdown report.
 * Pure string; safe to call anywhere on the server.
 */
export function renderArchitectureMarkdown(arch: Architecture): string {
  const m = arch.meta;
  const generated = new Date(m.generated_at).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const lines: string[] = [];
  const h = (s: string) => lines.push(s);
  const blank = () => lines.push("");

  h(`# ${m.title}`);
  blank();
  h(`> _${m.one_liner}_`);
  blank();
  h(`**Domain:** ${m.domain}  `);
  h(`**Generated:** ${generated} IST  `);
  h(`**By:** Tessar — AI Cloud Architect (Gemini on Vertex AI)`);
  blank();
  h(
    `> ⚠ **Draft for review.** This is an AI-generated architecture intended as a defensible first cut. Costs are ballpark estimates against public list pricing at generation time. Security & compliance controls are design-level mappings, not certifications. Verify cloud services, quotas and prices against the provider's current documentation before implementing. You retain full responsibility for the decisions you ship.`,
  );
  blank();
  h(`---`);
  blank();

  h(`## Executive Summary`);
  blank();
  h(arch.executive_summary);
  blank();

  /* Stats strip */
  h(`| Components | Diagrams | Tiers | Risks | Patterns |`);
  h(`|---|---|---|---|---|`);
  h(
    `| ${arch.components.length} | ${arch.diagrams.length} | ${arch.scale_profiles.length} | ${arch.risks.length} | ${arch.applied_patterns.length} |`,
  );
  blank();

  /* Requirements */
  h(`## 01 · Requirements`);
  blank();
  h(`### Functional`);
  arch.requirements.functional.forEach((r) => h(`- ${r}`));
  blank();
  h(`### Non-functional`);
  arch.requirements.non_functional.forEach((r) => h(`- ${r}`));
  blank();
  h(`### Assumptions`);
  arch.requirements.assumptions.forEach((r) => h(`- ${r}`));
  blank();

  /* Components */
  h(`## 02 · Components`);
  blank();
  h(`| Component | Category | Technology | Scaling |`);
  h(`|---|---|---|---|`);
  arch.components.forEach((c) =>
    h(`| ${esc(c.name)} | ${esc(c.category)} | ${esc(c.technology)} | ${esc(c.scaling)} |`),
  );
  blank();

  h(`### Tech stack`);
  blank();
  h(`| Layer | Choice | Rationale |`);
  h(`|---|---|---|`);
  arch.tech_stack.forEach((t) => h(`| ${esc(t.layer)} | ${esc(t.choice)} | ${esc(t.rationale)} |`));
  blank();

  /* Data flow */
  h(`## 03 · Data flow`);
  blank();
  h(`| # | From → To | Action | Protocol | Budget |`);
  h(`|---|---|---|---|---|`);
  arch.data_flows.forEach((d) =>
    h(
      `| ${d.step} | ${esc(d.from)} → ${esc(d.to)} | ${esc(d.action)} | ${esc(d.protocol)} | ${
        d.latency_budget_ms ? `${d.latency_budget_ms}ms` : "—"
      } |`,
    ),
  );
  blank();

  h(`### API surface`);
  blank();
  h(`| Method | Path | Purpose | Auth |`);
  h(`|---|---|---|---|`);
  arch.api_surface.forEach((a) =>
    h(`| \`${esc(a.method)}\` | \`${esc(a.path)}\` | ${esc(a.purpose)} | ${esc(a.auth)} |`),
  );
  blank();

  /* Diagrams */
  if (arch.diagrams.length) {
    h(`## 04 · Diagrams`);
    blank();
    arch.diagrams.forEach((d) => {
      h(`### ${d.title}`);
      if (d.description) h(`_${d.description}_`);
      blank();
      h("```mermaid");
      h(d.mermaid.trim());
      h("```");
      blank();
    });
  }

  /* Scale */
  h(`## 05 · Scale profiles`);
  blank();
  arch.scale_profiles.forEach((sp) => {
    const meta = SCALE_TIER_META[sp.tier];
    h(`### ${meta.label}`);
    h(
      `**₹${sp.monthly_cost_inr_low.toLocaleString("en-IN")} – ₹${sp.monthly_cost_inr_high.toLocaleString(
        "en-IN",
      )} / month** ($${sp.monthly_cost_usd_low}–$${sp.monthly_cost_usd_high})`,
    );
    blank();
    h(`- **Expected users:** ${sp.expected_users}`);
    h(`- **Traffic:** ${sp.expected_rps}`);
    h(`- **Storage:** ${sp.storage_estimate}`);
    h(`- **Read/write ratio:** ${sp.read_write_ratio}`);
    blank();
    if (sp.changes_from_baseline.length) {
      h(`**Changes from baseline:**`);
      sp.changes_from_baseline.forEach((c) => h(`- ${c}`));
      blank();
    }
  });

  /* Risks */
  h(`## 06 · Risk register`);
  blank();
  arch.risks.forEach((r) => {
    h(`### ${r.title}`);
    h(`**Category:** ${r.category}  |  **Likelihood:** ${r.likelihood}  |  **Impact:** ${r.impact}`);
    if (r.cloud_pattern) h(`**Pattern:** ${r.cloud_pattern}`);
    blank();
    h(r.mitigation);
    blank();
  });

  /* Patterns */
  h(`## 07 · Applied cloud design patterns`);
  blank();
  arch.applied_patterns.forEach((p) => {
    h(`### ${p.name} _(${p.category})_`);
    h(p.why);
    h(`_Applied at: ${p.where}_`);
    blank();
  });

  /* Security */
  h(`## 08 · Security controls`);
  blank();
  h(`| Control | Area | Implementation |`);
  h(`|---|---|---|`);
  arch.security.forEach((sc) =>
    h(`| ${esc(sc.control)} | ${esc(sc.area)} | ${esc(sc.implementation)} |`),
  );
  blank();

  /* Roadmap */
  h(`## 09 · Roadmap`);
  blank();
  arch.roadmap.forEach((r) => {
    h(`### ${r.phase} — ${r.timeline}`);
    r.milestones.forEach((mile) => h(`- ${mile}`));
    blank();
  });

  /* Open questions */
  if (arch.open_questions.length) {
    h(`## 10 · Open questions`);
    blank();
    arch.open_questions.forEach((q) => h(`- ${q}`));
    blank();
  }

  h(`---`);
  h(`_Generated by [Tessar](https://tessar.dev) — describe a system, get a design._`);

  return lines.join("\n");
}

function esc(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
