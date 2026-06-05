import "server-only";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import type { Architecture } from "@/types/architecture";
import { SCALE_TIER_META } from "@/types/architecture";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#0a0a0a",
    lineHeight: 1.5,
  },
  header: { marginBottom: 24, borderBottom: 1, borderColor: "#e5e5e5", paddingBottom: 12 },
  brand: { fontSize: 14, fontWeight: 700, color: "#0a0a0a" },
  title: { fontSize: 24, fontWeight: 700, marginTop: 8, marginBottom: 4, letterSpacing: -0.5 },
  oneLiner: { fontSize: 11, color: "#525252", marginBottom: 4 },
  domain: { fontSize: 9, color: "#737373", textTransform: "uppercase", letterSpacing: 1 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 8,
    color: "#0a0a0a",
    borderBottom: 1,
    borderColor: "#e5e5e5",
    paddingBottom: 4,
  },
  subTitle: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  para: { marginBottom: 6, color: "#262626" },
  bullet: { marginLeft: 12, marginBottom: 3, color: "#262626" },

  table: { display: "flex", flexDirection: "column", marginVertical: 6 },
  tr: { flexDirection: "row", borderBottom: 0.5, borderColor: "#e5e5e5", paddingVertical: 4 },
  trHead: { flexDirection: "row", borderBottom: 1, borderColor: "#0a0a0a", paddingVertical: 4 },
  th: { fontSize: 9, fontWeight: 700, color: "#0a0a0a" },
  td: { fontSize: 9, color: "#262626" },

  badge: {
    fontSize: 8,
    fontWeight: 700,
    color: "#fff",
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: "flex-start",
  },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#737373", textAlign: "center" },
});

function Row({ cells, widths, head = false }: { cells: string[]; widths: number[]; head?: boolean }) {
  return (
    <View style={head ? styles.trHead : styles.tr}>
      {cells.map((c, i) => (
        <Text key={i} style={[head ? styles.th : styles.td, { width: `${widths[i]}%`, paddingRight: 4 }]}>
          {c}
        </Text>
      ))}
    </View>
  );
}

export function ArchitectureReport({ arch }: { arch: Architecture }) {
  return (
    <Document title={arch.meta.title} author="Tessar">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>TESSAR · AI Cloud Architect</Text>
          <Text style={styles.title}>{arch.meta.title}</Text>
          <Text style={styles.oneLiner}>{arch.meta.one_liner}</Text>
          <Text style={styles.domain}>{arch.meta.domain}</Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.para}>{arch.executive_summary}</Text>

        <Text style={styles.sectionTitle}>Requirements</Text>
        <Text style={styles.subTitle}>Functional</Text>
        {arch.requirements.functional.map((r, i) => <Text key={i} style={styles.bullet}>• {r}</Text>)}
        <Text style={styles.subTitle}>Non-Functional</Text>
        {arch.requirements.non_functional.map((r, i) => <Text key={i} style={styles.bullet}>• {r}</Text>)}
        <Text style={styles.subTitle}>Assumptions</Text>
        {arch.requirements.assumptions.map((r, i) => <Text key={i} style={styles.bullet}>• {r}</Text>)}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Components</Text>
        <View style={styles.table}>
          <Row head cells={["Component", "Category", "Technology", "Scaling"]} widths={[25, 15, 30, 30]} />
          {arch.components.map((c) => (
            <Row key={c.id} cells={[c.name, c.category, c.technology, c.scaling]} widths={[25, 15, 30, 30]} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tech Stack</Text>
        <View style={styles.table}>
          <Row head cells={["Layer", "Choice", "Rationale"]} widths={[20, 25, 55]} />
          {arch.tech_stack.map((t, i) => (
            <Row key={i} cells={[t.layer, t.choice, t.rationale]} widths={[20, 25, 55]} />
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Data Flow</Text>
        <View style={styles.table}>
          <Row head cells={["#", "From → To", "Action", "Protocol", "Budget"]} widths={[6, 28, 36, 18, 12]} />
          {arch.data_flows.map((d) => (
            <Row
              key={d.step}
              cells={[
                String(d.step),
                `${d.from} → ${d.to}`,
                d.action,
                d.protocol,
                d.latency_budget_ms ? `${d.latency_budget_ms}ms` : "—",
              ]}
              widths={[6, 28, 36, 18, 12]}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>API Surface</Text>
        <View style={styles.table}>
          <Row head cells={["Method", "Path", "Purpose", "Auth"]} widths={[12, 28, 45, 15]} />
          {arch.api_surface.map((a, i) => (
            <Row key={i} cells={[a.method, a.path, a.purpose, a.auth]} widths={[12, 28, 45, 15]} />
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Scale Profiles</Text>
        {arch.scale_profiles.map((sp) => {
          const meta = SCALE_TIER_META[sp.tier];
          return (
            <View key={sp.tier} style={{ marginBottom: 12, padding: 8, backgroundColor: "#fafafa" }}>
              <Text style={styles.badge}>{meta.label.toUpperCase()}</Text>
              <Text style={{ ...styles.subTitle, marginTop: 6 }}>
                {sp.expected_users} · {sp.expected_rps}
              </Text>
              <Text style={styles.para}>
                Storage: {sp.storage_estimate} · R/W: {sp.read_write_ratio}
              </Text>
              <Text style={styles.para}>
                Monthly cost: ₹{sp.monthly_cost_inr_low.toLocaleString("en-IN")} – ₹
                {sp.monthly_cost_inr_high.toLocaleString("en-IN")} (${sp.monthly_cost_usd_low}–$
                {sp.monthly_cost_usd_high})
              </Text>
              {sp.changes_from_baseline.map((c, i) => (
                <Text key={i} style={styles.bullet}>• {c}</Text>
              ))}
            </View>
          );
        })}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Risks & Mitigations</Text>
        <View style={styles.table}>
          <Row head cells={["Risk", "Category", "L/I", "Mitigation", "Pattern"]} widths={[22, 12, 8, 40, 18]} />
          {arch.risks.map((r) => (
            <Row
              key={r.id}
              cells={[
                r.title,
                r.category,
                `${r.likelihood[0]!.toUpperCase()}/${r.impact[0]!.toUpperCase()}`,
                r.mitigation,
                r.cloud_pattern ?? "—",
              ]}
              widths={[22, 12, 8, 40, 18]}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Applied Cloud Design Patterns</Text>
        {arch.applied_patterns.map((p, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={styles.subTitle}>
              {p.name} <Text style={{ color: "#737373", fontWeight: 400 }}>· {p.category}</Text>
            </Text>
            <Text style={styles.para}>{p.why}</Text>
            <Text style={{ ...styles.para, color: "#737373" }}>Applied at: {p.where}</Text>
          </View>
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Security & Compliance</Text>
        <View style={styles.table}>
          <Row head cells={["Area", "Control", "Implementation", "GCP Service"]} widths={[14, 22, 44, 20]} />
          {arch.security.map((s, i) => (
            <Row key={i} cells={[s.area, s.control, s.implementation, s.gcp_service ?? "—"]} widths={[14, 22, 44, 20]} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Observability</Text>
        <Text style={styles.subTitle}>SLOs</Text>
        {arch.observability.slos.map((s, i) => (
          <Text key={i} style={styles.bullet}>• {s.name} → {s.target} over {s.window}</Text>
        ))}
        <Text style={styles.subTitle}>Alerts</Text>
        {arch.observability.alerts.map((a, i) => (
          <Text key={i} style={styles.bullet}>• [{a.severity.toUpperCase()}] {a.name} — {a.condition}</Text>
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Deployment</Text>
        <Text style={styles.para}>Primary region: {arch.deployment.primary_region}</Text>
        <Text style={styles.para}>Additional regions: {arch.deployment.additional_regions.join(", ") || "—"}</Text>
        <Text style={styles.para}>IaC: {arch.deployment.iac}</Text>
        <Text style={styles.para}>CI/CD: {arch.deployment.ci_cd}</Text>
        <Text style={styles.para}>Rollout: {arch.deployment.rollout_strategy}</Text>
        <Text style={styles.para}>Rollback: {arch.deployment.rollback_strategy}</Text>

        <Text style={styles.sectionTitle}>Roadmap</Text>
        {arch.roadmap.map((r, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={styles.subTitle}>{r.phase} · {r.timeline}</Text>
            {r.milestones.map((m, j) => <Text key={j} style={styles.bullet}>• {m}</Text>)}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Open Questions</Text>
        {arch.open_questions.map((q, i) => <Text key={i} style={styles.bullet}>• {q}</Text>)}

        <Text style={styles.footer}>
          Generated by Tessar · {new Date(arch.meta.generated_at).toLocaleString("en-IN")}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderArchitecturePDF(arch: Architecture): Promise<Buffer> {
  return renderToBuffer(<ArchitectureReport arch={arch} />);
}

// Silence unused Font import for now (kept for future custom typography)
void Font;
