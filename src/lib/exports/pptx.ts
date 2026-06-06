import "server-only";

import PptxGenJS from "pptxgenjs";
import type { Architecture } from "@/types/architecture";
import { SCALE_TIER_META } from "@/types/architecture";

/**
 * Renders an Architecture as a polished PowerPoint deck.
 * Returns a Node Buffer (PPTX is a zip).
 *
 * Palette mirrors the rest of the brand: paper background, ink text,
 * orange accent. 16:9 widescreen.
 */
export async function renderArchitecturePPTX(arch: Architecture): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.author = "Tessar";
  pptx.company = "Tessar";
  pptx.title = arch.meta.title;
  pptx.subject = arch.meta.one_liner;
  pptx.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in (16:9)

  const ink = "0E0E0F";
  const ink2 = "3A3A3D";
  const ink3 = "73737A";
  const paper = "FBFAF6";
  const paper2 = "F2F0EA";
  const accent = "E04F1E";
  const line = "D7D6D1";

  const W = 13.333;
  const H = 7.5;
  const M = 0.55; // margin

  function addBase(slide: PptxGenJS.Slide, eyebrow: string, title: string) {
    slide.background = { color: paper };
    // Top rule
    slide.addShape("rect", { x: M, y: 0.4, w: W - 2 * M, h: 0.012, fill: { color: ink } });
    // Brand label
    slide.addText("Tessar · AI Cloud Architect", {
      x: M,
      y: 0.05,
      w: 8,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 9,
      color: ink3,
      bold: true,
      charSpacing: 2,
    });
    slide.addText(arch.meta.domain.toUpperCase(), {
      x: W - M - 4,
      y: 0.05,
      w: 4,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 9,
      color: ink3,
      align: "right",
      charSpacing: 2,
    });

    // Section eyebrow
    slide.addText(eyebrow, {
      x: M,
      y: 0.55,
      w: 8,
      h: 0.35,
      fontFace: "Calibri",
      fontSize: 10,
      bold: true,
      color: accent,
      charSpacing: 3,
    });
    // Slide title
    slide.addText(title, {
      x: M,
      y: 0.9,
      w: W - 2 * M,
      h: 0.9,
      fontFace: "Calibri",
      fontSize: 32,
      bold: true,
      color: ink,
      charSpacing: -1,
    });
    // Page footer
    slide.addText("tessar.dev", {
      x: M,
      y: H - 0.4,
      w: 3,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 9,
      color: ink3,
      charSpacing: 2,
    });
  }

  /* COVER */
  {
    const slide = pptx.addSlide();
    slide.background = { color: paper };
    // Layered plate logo (four squares)
    const cx = M;
    const cy = 0.5;
    const sz = 0.5;
    [0.18, 0.34, 0.6, 1].forEach((op, i) => {
      slide.addShape("roundRect", {
        x: cx + i * 0.06,
        y: cy + i * 0.06,
        w: sz,
        h: sz,
        fill: { color: ink, transparency: Math.round((1 - op) * 100) },
        line: { type: "none" },
        rectRadius: 0.05,
      });
    });
    slide.addText("Tessar", {
      x: M + 0.95,
      y: 0.5,
      w: 4,
      h: 0.5,
      fontFace: "Calibri",
      fontSize: 22,
      bold: true,
      color: ink,
      charSpacing: -0.5,
    });
    slide.addText("VOLUME 01 · ARCHITECTURE REPORT", {
      x: W - M - 5,
      y: 0.7,
      w: 5,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 9,
      color: ink3,
      align: "right",
      charSpacing: 3,
    });
    // Rule
    slide.addShape("rect", { x: M, y: 1.6, w: W - 2 * M, h: 0.012, fill: { color: ink } });

    slide.addText("§ Brief", {
      x: M,
      y: 1.8,
      w: 4,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 11,
      bold: true,
      color: accent,
      charSpacing: 3,
    });
    slide.addText(arch.meta.domain.toUpperCase(), {
      x: M,
      y: 2.1,
      w: 8,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 10,
      color: ink3,
      charSpacing: 2,
    });
    slide.addText(arch.meta.title, {
      x: M,
      y: 2.5,
      w: W - 2 * M,
      h: 2,
      fontFace: "Calibri",
      fontSize: 52,
      bold: true,
      color: ink,
      charSpacing: -2,
    });
    slide.addText(arch.meta.one_liner, {
      x: M,
      y: 4.7,
      w: W - 2 * M - 1,
      h: 1.2,
      fontFace: "Calibri",
      fontSize: 18,
      italic: true,
      color: ink2,
    });
    // Stats strip
    const stats: [string, string][] = [
      [String(arch.components.length), "components"],
      [String(arch.diagrams.length), "diagrams"],
      [String(arch.scale_profiles.length), "scale tiers"],
      [String(arch.risks.length), "risks scored"],
      [String(arch.applied_patterns.length), "patterns"],
    ];
    const sw = (W - 2 * M) / stats.length;
    slide.addShape("rect", { x: M, y: 6.3, w: W - 2 * M, h: 0.012, fill: { color: line } });
    stats.forEach(([n, k], i) => {
      slide.addText(n, {
        x: M + sw * i,
        y: 6.45,
        w: sw,
        h: 0.6,
        fontFace: "Calibri",
        fontSize: 28,
        bold: true,
        color: ink,
        charSpacing: -1,
      });
      slide.addText(k.toUpperCase(), {
        x: M + sw * i,
        y: 7.0,
        w: sw,
        h: 0.3,
        fontFace: "Calibri",
        fontSize: 9,
        color: ink3,
        charSpacing: 2,
      });
    });
  }

  /* EXECUTIVE SUMMARY */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 00 · Summary", "Executive summary");
    slide.addText(arch.executive_summary, {
      x: M,
      y: 2.1,
      w: W - 2 * M,
      h: H - 2.6,
      fontFace: "Calibri",
      fontSize: 18,
      color: ink2,
      paraSpaceAfter: 8,
    });
  }

  /* REQUIREMENTS — split into three columns */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 01 · Brief", "Requirements & assumptions");
    const colW = (W - 2 * M - 0.6) / 3;
    const groups: [string, string[]][] = [
      ["Functional", arch.requirements.functional],
      ["Non-functional", arch.requirements.non_functional],
      ["Assumptions", arch.requirements.assumptions],
    ];
    groups.forEach(([label, items], i) => {
      const x = M + i * (colW + 0.3);
      slide.addText(label, {
        x,
        y: 2,
        w: colW,
        h: 0.4,
        fontFace: "Calibri",
        fontSize: 13,
        bold: true,
        color: ink,
      });
      slide.addText(items.map((t) => ({ text: t, options: { bullet: true } })), {
        x,
        y: 2.4,
        w: colW,
        h: H - 3,
        fontFace: "Calibri",
        fontSize: 11,
        color: ink2,
        paraSpaceAfter: 4,
        valign: "top",
      });
    });
  }

  /* COMPONENTS table */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 02 · Pieces", "Components");
    const rows: PptxGenJS.TableRow[] = [
      [
        cellHead("Component"),
        cellHead("Category"),
        cellHead("Technology"),
        cellHead("Scaling"),
      ],
      ...arch.components.map((c) => [
        cell(c.name, ink, true),
        cell(c.category, ink2),
        cell(c.technology, ink2),
        cell(c.scaling, ink2),
      ]),
    ];
    slide.addTable(rows, {
      x: M,
      y: 2,
      w: W - 2 * M,
      colW: [3.2, 2.0, 4.0, 3.0],
      fontFace: "Calibri",
      fontSize: 10,
      border: { type: "solid", pt: 0.5, color: line },
    });
  }

  /* TECH STACK */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 02b · Decisions", "Tech stack");
    const rows: PptxGenJS.TableRow[] = [
      [cellHead("Layer"), cellHead("Choice"), cellHead("Rationale")],
      ...arch.tech_stack.map((t) => [
        cell(t.layer, ink, true),
        cell(t.choice, ink2),
        cell(t.rationale, ink2),
      ]),
    ];
    slide.addTable(rows, {
      x: M,
      y: 2,
      w: W - 2 * M,
      colW: [2.4, 3.0, 6.8],
      fontFace: "Calibri",
      fontSize: 10,
      border: { type: "solid", pt: 0.5, color: line },
    });
  }

  /* DATA FLOW */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 03 · Traffic", "Data flow");
    const rows: PptxGenJS.TableRow[] = [
      [
        cellHead("#"),
        cellHead("From → To"),
        cellHead("Action"),
        cellHead("Protocol"),
        cellHead("Budget"),
      ],
      ...arch.data_flows.map((d) => [
        cell(String(d.step), ink, true),
        cell(`${d.from} → ${d.to}`, ink2),
        cell(d.action, ink2),
        cell(d.protocol, ink2),
        cell(d.latency_budget_ms ? `${d.latency_budget_ms}ms` : "—", ink2),
      ]),
    ];
    slide.addTable(rows, {
      x: M,
      y: 2,
      w: W - 2 * M,
      colW: [0.5, 3.5, 5.0, 1.7, 1.5],
      fontFace: "Calibri",
      fontSize: 10,
      border: { type: "solid", pt: 0.5, color: line },
    });
  }

  /* SCALE PROFILES — three cost cards */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 04 · Numbers", "Scale profiles · monthly cost");
    const cardW = (W - 2 * M - 0.6) / Math.max(arch.scale_profiles.length, 1);
    arch.scale_profiles.forEach((sp, i) => {
      const meta = SCALE_TIER_META[sp.tier];
      const x = M + i * (cardW + 0.3);
      slide.addShape("rect", {
        x,
        y: 2,
        w: cardW,
        h: H - 2.6,
        fill: { color: paper2 },
        line: { color: line, width: 0.5 },
      });
      slide.addText(meta.label.toUpperCase(), {
        x: x + 0.2,
        y: 2.15,
        w: cardW - 0.4,
        h: 0.3,
        fontFace: "Calibri",
        fontSize: 10,
        bold: true,
        color: accent,
        charSpacing: 3,
      });
      slide.addText(`₹${sp.monthly_cost_inr_low.toLocaleString("en-IN")}`, {
        x: x + 0.2,
        y: 2.55,
        w: cardW - 0.4,
        h: 0.8,
        fontFace: "Calibri",
        fontSize: 32,
        bold: true,
        color: ink,
        charSpacing: -1,
      });
      slide.addText(
        `– ₹${sp.monthly_cost_inr_high.toLocaleString("en-IN")} / month`,
        {
          x: x + 0.2,
          y: 3.4,
          w: cardW - 0.4,
          h: 0.3,
          fontFace: "Calibri",
          fontSize: 10,
          color: ink3,
        },
      );
      slide.addText(
        [
          { text: "Users\n", options: { fontSize: 8, color: ink3, bold: true, charSpacing: 2 } },
          { text: `${sp.expected_users}\n\n`, options: { fontSize: 11, color: ink } },
          { text: "Traffic\n", options: { fontSize: 8, color: ink3, bold: true, charSpacing: 2 } },
          { text: `${sp.expected_rps}\n\n`, options: { fontSize: 11, color: ink } },
          { text: "Storage\n", options: { fontSize: 8, color: ink3, bold: true, charSpacing: 2 } },
          { text: sp.storage_estimate, options: { fontSize: 11, color: ink } },
        ],
        {
          x: x + 0.2,
          y: 3.8,
          w: cardW - 0.4,
          h: H - 4.5,
          fontFace: "Calibri",
          valign: "top",
        },
      );
    });
  }

  /* RISKS */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 05 · Risks", "Risk register");
    const items = arch.risks.slice(0, 8); // keep one slide tidy
    slide.addText(
      items.map((r) => ({
        text:
          `${r.title}  —  ${r.likelihood}/${r.impact}\n${r.mitigation}\n`,
        options: { bullet: true, paraSpaceAfter: 6, color: ink2 },
      })),
      {
        x: M,
        y: 2,
        w: W - 2 * M,
        h: H - 2.6,
        fontFace: "Calibri",
        fontSize: 11,
        valign: "top",
      },
    );
  }

  /* PATTERNS */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 06 · Patterns", "Applied cloud design patterns");
    slide.addText(
      arch.applied_patterns.map((p) => ({
        text: `${p.name}  ·  ${p.category}\n${p.why}\nApplied at: ${p.where}\n`,
        options: { bullet: true, paraSpaceAfter: 6, color: ink2 },
      })),
      {
        x: M,
        y: 2,
        w: W - 2 * M,
        h: H - 2.6,
        fontFace: "Calibri",
        fontSize: 11,
        valign: "top",
      },
    );
  }

  /* SECURITY */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 07 · Guards", "Security controls");
    const rows: PptxGenJS.TableRow[] = [
      [cellHead("Control"), cellHead("Area"), cellHead("Implementation")],
      ...arch.security.map((sc) => [
        cell(sc.control, ink, true),
        cell(sc.area, ink2),
        cell(sc.implementation, ink2),
      ]),
    ];
    slide.addTable(rows, {
      x: M,
      y: 2,
      w: W - 2 * M,
      colW: [3.2, 2.0, 7.0],
      fontFace: "Calibri",
      fontSize: 10,
      border: { type: "solid", pt: 0.5, color: line },
    });
  }

  /* ROADMAP + OPEN QUESTIONS */
  {
    const slide = pptx.addSlide();
    addBase(slide, "§ 08 · Next", "Roadmap");
    slide.addText(
      arch.roadmap.flatMap((r) => [
        { text: `${r.phase}  ·  ${r.timeline}\n`, options: { bold: true, color: ink, fontSize: 13 } },
        ...r.milestones.map((m) => ({
          text: `${m}\n`,
          options: { bullet: true, color: ink2, fontSize: 11 },
        })),
      ]),
      {
        x: M,
        y: 2,
        w: (W - 2 * M) * 0.55,
        h: H - 2.6,
        fontFace: "Calibri",
        valign: "top",
        paraSpaceAfter: 4,
      },
    );

    if (arch.open_questions.length) {
      slide.addText("§ 09 · Watch", {
        x: M + (W - 2 * M) * 0.6,
        y: 2,
        w: (W - 2 * M) * 0.4,
        h: 0.3,
        fontFace: "Calibri",
        fontSize: 11,
        bold: true,
        color: accent,
        charSpacing: 3,
      });
      slide.addText("Open questions", {
        x: M + (W - 2 * M) * 0.6,
        y: 2.3,
        w: (W - 2 * M) * 0.4,
        h: 0.5,
        fontFace: "Calibri",
        fontSize: 18,
        bold: true,
        color: ink,
      });
      slide.addText(
        arch.open_questions.map((q) => ({
          text: q,
          options: { bullet: true, color: ink2, paraSpaceAfter: 6 },
        })),
        {
          x: M + (W - 2 * M) * 0.6,
          y: 2.9,
          w: (W - 2 * M) * 0.4,
          h: H - 3.5,
          fontFace: "Calibri",
          fontSize: 11,
          valign: "top",
        },
      );
    }
  }

  /* CLOSING */
  {
    const slide = pptx.addSlide();
    slide.background = { color: ink };
    slide.addText("This is a starting draft.\nNot a final answer.", {
      x: M,
      y: 2.4,
      w: W - 2 * M,
      h: 2.4,
      fontFace: "Calibri",
      fontSize: 52,
      bold: true,
      color: paper,
      charSpacing: -2,
    });
    slide.addText(
      "Tessar produces a defensible first cut you can argue with — share with your team, disagree, iterate. Re-run with a sharper brief at tessar.dev.",
      {
        x: M,
        y: 4.8,
        w: W - 2 * M - 2,
        h: 1.5,
        fontFace: "Calibri",
        fontSize: 16,
        color: paper2,
        italic: true,
      },
    );
    slide.addText("tessar.dev", {
      x: M,
      y: H - 0.6,
      w: 3,
      h: 0.4,
      fontFace: "Calibri",
      fontSize: 11,
      bold: true,
      color: paper,
      charSpacing: 2,
    });
  }

  function cellHead(t: string): PptxGenJS.TableCell {
    return {
      text: t,
      options: {
        bold: true,
        color: ink,
        fill: { color: paper2 },
        fontSize: 9,
        valign: "middle",
        margin: 0.08,
      },
    };
  }
  function cell(t: string, color: string, bold = false): PptxGenJS.TableCell {
    return {
      text: t,
      options: { color, bold, valign: "top", margin: 0.08 },
    };
  }

  const data = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return data;
}
