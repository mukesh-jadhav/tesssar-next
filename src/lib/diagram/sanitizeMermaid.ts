/**
 * Best-effort Mermaid sanitizer applied right before render. The
 * agent's system prompt asks the model to produce valid Mermaid, but
 * LLM output drifts — backtick fences leak in, node IDs grow hyphens,
 * labels contain unescaped parens / brackets / literal `\n` escapes.
 * These fixes are conservative: we only repair patterns that ALWAYS
 * break the parser and otherwise leave the source untouched.
 */

const FENCE_RE = /^\s*```(?:mermaid)?\s*([\s\S]*?)```?\s*$/;

const RESERVED = new Set([
  "graph", "flowchart", "subgraph", "end", "sequencediagram", "participant",
  "actor", "note", "loop", "alt", "else", "opt", "par", "and", "rect",
  "classdiagram", "class", "state", "statediagram", "statediagram-v2",
  "erdiagram", "journey", "gantt", "pie", "requirementdiagram",
  "gitgraph", "mindmap", "timeline", "quadrantchart", "xychart-beta",
  "block-beta", "td", "tb", "bt", "lr", "rl",
]);

/** Strip a single outer ```mermaid ... ``` fence + any stray backticks. */
function unwrapFences(src: string): string {
  const m = src.trim().match(FENCE_RE);
  if (m) return m[1].trim();
  return src.replace(/```/g, "").trim();
}

/** Drop a leading BOM and zero-width chars sometimes copied from markdown. */
function stripInvisibles(src: string): string {
  return src.replace(/^\uFEFF/, "").replace(/[\u200B-\u200F\u202A-\u202E]/g, "");
}

/** Demote unstable C4 directives to flowchart TD so they at least render. */
function demoteUnstableC4(src: string): string {
  return src.replace(/^\s*(C4(?:Context|Container|Component|Dynamic))\b.*$/im,
    "flowchart TD");
}

type ChartKind = "flowchart" | "sequence" | "state" | "er" | "class" | "other";

function chartKind(src: string): ChartKind {
  for (const raw of src.split("\n")) {
    const l = raw.trim();
    if (!l || l.startsWith("%%")) continue;
    if (/^(?:flowchart|graph)\b/i.test(l)) return "flowchart";
    if (/^sequenceDiagram\b/i.test(l)) return "sequence";
    if (/^stateDiagram(?:-v2)?\b/i.test(l)) return "state";
    if (/^erDiagram\b/i.test(l)) return "er";
    if (/^classDiagram\b/i.test(l)) return "class";
    return "other";
  }
  return "other";
}

/** Strip sequence-only `actor`/`participant` lines slipped into flowcharts. */
function stripWrongDialectActors(src: string, kind: ChartKind): string {
  if (kind !== "flowchart") return src;
  return src
    .split("\n")
    .filter((l) => !/^\s*actor\b/i.test(l) && !/^\s*participant\b/i.test(l))
    .join("\n");
}

/**
 * Clean up a label body so it survives `["..."]` wrapping.
 * - literal `\n` and real newlines → `<br/>`
 * - strip inner `[` and `]` (they're parser-confusing noise)
 * - escape `"` to `'`
 * - collapse whitespace runs
 */
function normalizeLabelBody(s: string): string {
  return s
    .replace(/\\n/g, "<br/>")
    .replace(/\r?\n/g, "<br/>")
    .replace(/[\[\]]/g, "")
    .replace(/"/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function labelNeedsQuoting(body: string): boolean {
  return (
    body.includes("[") ||
    body.includes("]") ||
    body.includes("\\n") ||
    body.includes("\n") ||
    /[<>]/.test(body)
  );
}

/**
 * Walk a flowchart line and rewrite every node-shape label that fails
 * `labelNeedsQuoting`. Hand-rolled because nested brackets defeat regex.
 */
function rewriteLabels(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return line;
  if (/^(?:subgraph|end|direction|click|classDef|class\s|linkStyle|style\s|%%)/i.test(trimmed)) {
    return line;
  }

  let i = 0;
  let out = "";
  while (i < line.length) {
    const ch = line[i];
    const next = line[i + 1];

    // Skip pre-quoted strings.
    if (ch === '"') {
      const end = line.indexOf('"', i + 1);
      if (end === -1) { out += line.slice(i); break; }
      out += line.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    let opener: string | null = null;
    let closer: string | null = null;
    if (ch === "[" && next === "[")      { opener = "[["; closer = "]]"; }
    else if (ch === "[" && next === "(") { opener = "[("; closer = ")]"; }
    else if (ch === "(" && next === "(") { opener = "(("; closer = "))"; }
    else if (ch === "[")                 { opener = "[";  closer = "]";  }
    else if (ch === "(")                 { opener = "(";  closer = ")";  }
    else if (ch === "{" && next === "{") { opener = "{{"; closer = "}}"; }
    else if (ch === "{")                 { opener = "{";  closer = "}";  }

    if (!opener || !closer) {
      out += ch;
      i += 1;
      continue;
    }

    const bodyStart = i + opener.length;
    let j = bodyStart;
    let depth = 1;
    let hadNestedSameKind = false;
    const openChar = opener[opener.length - 1];
    const closeChar = closer[0];
    while (j < line.length) {
      if (closer.length === 2 && line.slice(j, j + 2) === closer) {
        depth -= 1;
        if (depth === 0) break;
        j += 2;
        continue;
      }
      if (line[j] === '"') {
        const e = line.indexOf('"', j + 1);
        if (e === -1) { j = line.length; break; }
        j = e + 1;
        continue;
      }
      if (line[j] === openChar && opener.length === 1) {
        depth += 1;
        hadNestedSameKind = true;
        j += 1;
        continue;
      }
      if (line[j] === closeChar && closer.length === 1) {
        depth -= 1;
        if (depth === 0) break;
        j += 1;
        continue;
      }
      j += 1;
    }

    if (depth !== 0) {
      out += line.slice(i);
      break;
    }

    const body = line.slice(bodyStart, j);
    const consumeEnd = j + closer.length;

    if (hadNestedSameKind || labelNeedsQuoting(body)) {
      out += `["${normalizeLabelBody(body)}"]`;
    } else {
      out += line.slice(i, consumeEnd);
    }
    i = consumeEnd;
  }
  return out;
}

/** Convert hyphens in bare flowchart identifiers to underscores. */
function fixIdentifierHyphens(line: string): string {
  return line.replace(
    /(^|[\s\(\)\[\]\{\}|;>])([A-Za-z_][A-Za-z0-9_-]*[A-Za-z0-9])(?=[\s\(\[\{:|;<>=]|$)/g,
    (whole, prefix: string, ident: string) => {
      if (!ident.includes("-")) return whole;
      const lower = ident.toLowerCase();
      if (RESERVED.has(lower)) return whole;
      if (/^-+>?$/.test(ident)) return whole;
      return prefix + ident.replace(/-/g, "_");
    },
  );
}

export function sanitizeMermaid(raw: string): string {
  if (!raw) return raw;
  let src = stripInvisibles(raw);
  src = unwrapFences(src);
  src = demoteUnstableC4(src);
  const kind = chartKind(src);
  src = stripWrongDialectActors(src, kind);

  if (kind !== "flowchart") return src;

  return src
    .split("\n")
    .map((line) => {
      if (/^\s*%%/.test(line)) return line;
      let l = rewriteLabels(line);
      l = fixIdentifierHyphens(l);
      return l;
    })
    .join("\n");
}
