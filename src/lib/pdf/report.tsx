import "server-only";

import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Rect,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import type { Architecture } from "@/types/architecture";
import { SCALE_TIER_META } from "@/types/architecture";

/* Brand palette — mirrors the editorial Tessar identity. */
const ink    = "#0E0E0F";
const ink2   = "#3A3A3D";
const ink3   = "#73737A";
const line   = "#D7D6D1";
const paper  = "#FBFAF6";
const paper2 = "#F2F0EA";
const accent = "#E04F1E";
const warn   = "#B98309";
const bad    = "#B43A2E";

const fonts = { sans: "Helvetica", sansBold: "Helvetica-Bold", serif: "Times-Italic" };

const s = StyleSheet.create({
  page: {
    fontFamily: fonts.sans,
    fontSize: 9.5,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    color: ink2,
    lineHeight: 1.5,
    backgroundColor: paper,
  },
  runHead: {
    position: "absolute",
    top: 22,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: ink3,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: ink3,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  sectionEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 7.5,
    color: accent,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    color: ink,
    letterSpacing: -0.4,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: ink,
  },
  subTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    color: ink,
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  para:    { marginBottom: 6, color: ink2 },
  lead:    { fontSize: 11, color: ink, lineHeight: 1.55, marginBottom: 10 },
  serif:   { fontFamily: fonts.serif, color: ink2 },
  bullet:  { marginLeft: 12, marginBottom: 3, color: ink2 },
  small:   { fontSize: 8.5, color: ink3 },
  table:   { marginTop: 4, marginBottom: 6 },
  trHead:  {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: ink,
    borderBottomWidth: 0.5,
    borderBottomColor: ink,
    paddingVertical: 5,
    backgroundColor: paper2,
  },
  tr:      {
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: line,
    paddingVertical: 5,
  },
  trAlt:   {
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: line,
    paddingVertical: 5,
    backgroundColor: paper2,
  },
  th:      { fontFamily: fonts.sansBold, fontSize: 8, color: ink, textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: 6 },
  td:      { fontSize: 8.8, color: ink2, paddingHorizontal: 6 },
  pill:    {
    fontFamily: fonts.sansBold,
    fontSize: 7,
    color: paper,
    backgroundColor: ink,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: "flex-start",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pillAccent: { backgroundColor: accent },
  pillWarn:   { backgroundColor: warn },
  pillBad:    { backgroundColor: bad },
  card: {
    borderWidth: 0.7,
    borderColor: line,
    backgroundColor: paper,
    padding: 12,
    marginBottom: 10,
  },
  cardDark: {
    backgroundColor: ink,
    padding: 14,
    marginBottom: 10,
  },
  tierGrid: { flexDirection: "row", gap: 8, marginTop: 6 },
  tier: {
    flex: 1,
    borderWidth: 0.7,
    borderColor: line,
    backgroundColor: paper,
    padding: 10,
  },
  tierLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: ink3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tierPrice: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: ink,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
});

function MarkSVG({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x={4}  y={4}  width={26} height={26} rx={2.5} fill={ink} fillOpacity={0.16} />
      <Rect x={7}  y={7}  width={26} height={26} rx={2.5} fill={ink} fillOpacity={0.34} />
      <Rect x={10} y={10} width={26} height={26} rx={2.5} fill={ink} fillOpacity={0.6} />
      <Rect x={13} y={13} width={23} height={23} rx={2.5} fill={ink} />
      <Rect x={17}   y={19.5} width={15}  height={1.6}  rx={0.8} fill={paper} fillOpacity={0.92} />
      <Rect x={23.7} y={20.6} width={1.6} height={11.5} rx={0.8} fill={paper} fillOpacity={0.92} />
    </Svg>
  );
}

function RunningHeader({ title }: { title: string }) {
  return (
    <View style={s.runHead} fixed>
      <Text>Tessar · {title.slice(0, 70)}</Text>
      <Text>AI Cloud Architect</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>tessar.dev</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <Text style={s.sectionEyebrow}>{eyebrow}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </>
  );
}

function Row({
  cells,
  widths,
  head = false,
  alt = false,
}: {
  cells: string[];
  widths: number[];
  head?: boolean;
  alt?: boolean;
}) {
  return (
    <View style={head ? s.trHead : alt ? s.trAlt : s.tr}>
      {cells.map((c, i) => (
        <Text key={i} style={[head ? s.th : s.td, { width: `${widths[i]}%` }]}>
          {c}
        </Text>
      ))}
    </View>
  );
}

function severityPill(impact: string) {
  const v = impact.toLowerCase();
  if (v === "high" || v === "critical") return [s.pill, s.pillBad];
  if (v === "medium") return [s.pill, s.pillWarn];
  return s.pill;
}

export function ArchitectureReport({ arch }: { arch: Architecture }) {
  const title = arch.meta.title;
  const generated = new Date(arch.meta.generated_at);
  const tiers = arch.scale_profiles;

  return (
    <Document title={title} author="Tessar" creator="Tessar — AI Cloud Architect" producer="Tessar">
      {/* COVER */}
      <Page size="A4" style={[s.page, { backgroundColor: paper, paddingTop: 64 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <MarkSVG size={26} />
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, letterSpacing: -0.2, color: ink }}>
            Tessar
          </Text>
          <Text style={{ ...s.small, marginLeft: "auto", letterSpacing: 1.4, textTransform: "uppercase" }}>
            Volume 01 · Architecture Report
          </Text>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: ink, marginTop: 26, paddingTop: 22 }}>
          <Text style={{ ...s.sectionEyebrow, marginTop: 0 }}>§ Brief</Text>
          <Text style={{ fontSize: 9.5, color: ink3, marginBottom: 4, letterSpacing: 1.2, textTransform: "uppercase" }}>
            {arch.meta.domain}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 38,
            lineHeight: 1.04,
            color: ink,
            letterSpacing: -1.4,
            marginTop: 16,
            marginBottom: 18,
          }}
        >
          {title}
        </Text>

        <Text style={{ ...s.serif, fontSize: 14, lineHeight: 1.5, color: ink2, marginBottom: 28, maxWidth: 460 }}>
          {arch.meta.one_liner}
        </Text>

        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 0.6,
            borderTopColor: line,
            borderBottomWidth: 0.6,
            borderBottomColor: line,
            paddingVertical: 12,
            marginBottom: 28,
          }}
        >
          <CoverStat n={String(arch.components.length)} k="components" />
          <CoverStat n={String(arch.diagrams.length)} k="diagrams" />
          <CoverStat n={String(arch.scale_profiles.length)} k="scale tiers" />
          <CoverStat n={String(arch.risks.length)} k="risks scored" />
          <CoverStat n={String(arch.applied_patterns.length)} k="patterns" />
        </View>

        <Text style={s.sectionEyebrow}>§ Executive Summary</Text>
        <Text style={s.lead}>{arch.executive_summary}</Text>

        <View
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 40,
            flexDirection: "row",
            justifyContent: "space-between",
            borderTopWidth: 0.6,
            borderTopColor: line,
            paddingTop: 10,
          }}
        >
          <Text style={s.small}>
            Generated {generated.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} IST
          </Text>
          <Text style={s.small}>Powered by Gemini on Vertex AI</Text>
        </View>
      </Page>

      {/* REQUIREMENTS */}
      <Page size="A4" style={s.page}>
        <RunningHeader title={title} />
        <SectionHeader eyebrow="§ 01 · Brief" title="Requirements & assumptions" />

        <Text style={s.subTitle}>Functional</Text>
        {arch.requirements.functional.map((r, i) => <Text key={i} style={s.bullet}>• {r}</Text>)}

        <Text style={s.subTitle}>Non-functional</Text>
        {arch.requirements.non_functional.map((r, i) => <Text key={i} style={s.bullet}>• {r}</Text>)}

        <Text style={s.subTitle}>Assumptions</Text>
        {arch.requirements.assumptions.map((r, i) => <Text key={i} style={s.bullet}>• {r}</Text>)}

        <Footer />
      </Page>

      {/* COMPONENTS + STACK */}
      <Page size="A4" style={s.page}>
        <RunningHeader title={title} />
        <SectionHeader eyebrow="§ 02 · Pieces" title="Components" />
        <View style={s.table}>
          <Row head cells={["Component", "Category", "Technology", "Scaling"]} widths={[26, 16, 30, 28]} />
          {arch.components.map((c, i) => (
            <Row key={c.id} alt={i % 2 === 1} cells={[c.name, c.category, c.technology, c.scaling]} widths={[26, 16, 30, 28]} />
          ))}
        </View>

        <SectionHeader eyebrow="§ 02b · Decisions" title="Tech stack" />
        <View style={s.table}>
          <Row head cells={["Layer", "Choice", "Rationale"]} widths={[22, 24, 54]} />
          {arch.tech_stack.map((t, i) => (
            <Row key={i} alt={i % 2 === 1} cells={[t.layer, t.choice, t.rationale]} widths={[22, 24, 54]} />
          ))}
        </View>
        <Footer />
      </Page>

      {/* DATA FLOW + API */}
      <Page size="A4" style={s.page}>
        <RunningHeader title={title} />
        <SectionHeader eyebrow="§ 03 · Traffic" title="Data flow" />
        <View style={s.table}>
          <Row head cells={["#", "From → To", "Action", "Protocol", "Budget"]} widths={[6, 28, 36, 18, 12]} />
          {arch.data_flows.map((d, i) => (
            <Row
              key={d.step}
              alt={i % 2 === 1}
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

        <SectionHeader eyebrow="§ 03b · Surface" title="API endpoints" />
        <View style={s.table}>
          <Row head cells={["Method", "Path", "Purpose", "Auth"]} widths={[12, 28, 45, 15]} />
          {arch.api_surface.map((a, i) => (
            <Row key={i} alt={i % 2 === 1} cells={[a.method, a.path, a.purpose, a.auth]} widths={[12, 28, 45, 15]} />
          ))}
        </View>
        <Footer />
      </Page>

      {/* SCALE PROFILES */}
      <Page size="A4" style={s.page}>
        <RunningHeader title={title} />
        <SectionHeader eyebrow="§ 04 · Numbers" title="Scale profiles" />

        <View style={s.tierGrid}>
          {tiers.map((sp) => {
            const meta = SCALE_TIER_META[sp.tier];
            return (
              <View key={sp.tier} style={s.tier}>
                <Text style={s.tierLabel}>{meta.label}</Text>
                <Text style={s.tierPrice}>
                  ₹{sp.monthly_cost_inr_low.toLocaleString("en-IN")}
                </Text>
                <Text style={{ ...s.small, marginBottom: 6 }}>
                  – ₹{sp.monthly_cost_inr_high.toLocaleString("en-IN")} / mo
                </Text>
                <Text style={{ ...s.small, marginBottom: 2 }}>{sp.expected_users}</Text>
                <Text style={{ ...s.small, marginBottom: 6 }}>{sp.expected_rps}</Text>
                <Text style={{ ...s.small, color: ink2 }}>Storage: {sp.storage_estimate}</Text>
                <Text style={{ ...s.small, color: ink2 }}>R/W: {sp.read_write_ratio}</Text>
              </View>
            );
          })}
        </View>

        {tiers.map((sp) => {
          const meta = SCALE_TIER_META[sp.tier];
          return (
            <View key={sp.tier} style={{ marginTop: 14 }}>
              <Text style={[s.pill, s.pillAccent]}>{meta.label}</Text>
              <Text style={[s.subTitle, { marginTop: 6 }]}>Changes from baseline</Text>
              {sp.changes_from_baseline.map((c, i) => (
                <Text key={i} style={s.bullet}>• {c}</Text>
              ))}
            </View>
          );
        })}
        <Footer />
      </Page>

      {/* RISKS */}
      <Page size="A4" style={s.page}>
        <RunningHeader title={title} />
        <SectionHeader eyebrow="§ 05 · Risks" title="Risk register" />

        {arch.risks.map((r) => (
          <View key={r.id} style={s.card} wrap={false}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: ink, flex: 1, paddingRight: 8 }}>
                {r.title}
              </Text>
              <Text style={severityPill(r.impact)}>
                {r.likelihood} · {r.impact}
              </Text>
            </View>
            <Text style={{ ...s.small, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 }}>
              {r.category}{r.cloud_pattern ? `  ·  Pattern: ${r.cloud_pattern}` : ""}
            </Text>
            <Text style={s.para}>{r.mitigation}</Text>
          </View>
        ))}
        <Footer />
      </Page>

      {/* PATTERNS + SECURITY */}
      <Page size="A4" style={s.page}>
        <RunningHeader title={title} />
        <SectionHeader eyebrow="§ 06 · Patterns" title="Applied cloud design patterns" />
        {arch.applied_patterns.map((p, i) => (
          <View key={i} style={{ marginBottom: 8 }} wrap={false}>
            <Text style={s.subTitle}>
              {p.name}  <Text style={{ ...s.small, color: ink3 }}>· {p.category}</Text>
            </Text>
            <Text style={s.para}>{p.why}</Text>
            <Text style={{ ...s.small, color: ink3 }}>Applied at: {p.where}</Text>
          </View>
        ))}

        <SectionHeader eyebrow="§ 07 · Guards" title="Security controls" />
        <View style={s.table}>
          <Row head cells={["Control", "Area", "Implementation"]} widths={[28, 18, 54]} />
          {arch.security.map((sc, i) => (
            <Row key={i} alt={i % 2 === 1} cells={[sc.control, sc.area, sc.implementation]} widths={[28, 18, 54]} />
          ))}
        </View>
        <Footer />
      </Page>

      {/* ROADMAP + OPEN QUESTIONS */}
      <Page size="A4" style={s.page}>
        <RunningHeader title={title} />
        <SectionHeader eyebrow="§ 08 · Next" title="Roadmap" />
        {arch.roadmap.map((r, i) => (
          <View key={i} style={{ marginBottom: 10 }} wrap={false}>
            <Text style={s.subTitle}>
              {r.phase}  <Text style={{ ...s.small, color: ink3 }}>· {r.timeline}</Text>
            </Text>
            {r.milestones.map((m, j) => <Text key={j} style={s.bullet}>• {m}</Text>)}
          </View>
        ))}

        <SectionHeader eyebrow="§ 09 · Watch" title="Open questions" />
        {arch.open_questions.map((q, i) => <Text key={i} style={s.bullet}>• {q}</Text>)}

        <View style={[s.cardDark, { marginTop: 22 }]}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: paper, marginBottom: 4 }}>
            This is a starting draft, not a final answer.
          </Text>
          <Text style={{ fontSize: 9, color: paper2, lineHeight: 1.5 }}>
            Tessar produces a defensible first cut you can argue with — share it with your team,
            disagree, iterate. Re-run with a sharper brief any time at tessar.dev.
          </Text>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

function CoverStat({ n, k }: { n: string; k: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 18, color: ink, letterSpacing: -0.5 }}>{n}</Text>
      <Text style={{ fontSize: 7.5, color: ink3, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 2 }}>{k}</Text>
    </View>
  );
}

export async function renderArchitecturePDF(arch: Architecture): Promise<Buffer> {
  return renderToBuffer(<ArchitectureReport arch={arch} />);
}
