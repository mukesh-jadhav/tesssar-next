/**
 * Best-effort Mermaid sanitizer applied right before render. The
 * agent's system prompt asks the model to produce valid Mermaid, but
 * LLM output drifts — backtick fences leak in, node IDs grow hyphens,
 * labels contain unescaped parens. These fixes are conservative: we
 * only repair patterns that ALWAYS break the parser and otherwise
 * leave the source untouched.
 *
 * Order matters — we unwrap fences first (so subsequent regexes see
 * the actual chart), then operate line-by-line for the safer rules.
 */

const FENCE_RE = /^\s*```(?:mermaid)?\s*([\s\S]*?)```?\s*$/;

/**
 * 1. Strip a single outer ```mermaid ... ``` fence if present (and any
 *    stray trailing/leading backticks the model sometimes adds).
 */
function unwrapFences(src: string): string {
  const m = src.trim().match(FENCE_RE);
  if (m) return m[1].trim();
  return src.replace(/```/g, "").trim();
}

/**
 * 2. Convert hyphens inside Mermaid node IDs to underscores. The
 *    parser allows hyphens inside *quoted labels* but not in raw IDs
 *    like `api-gateway-->db`. Hardest part: don't rewrite hyphens
 *    that are inside `[label]`, `("label")`, `{label}`, `(("label"))`,
 *    or quoted strings.
 *
 *    Approach: walk the line character by character, tracking which
 *    bracketing context we're in. Only mutate hyphens that sit in the
 *    bare-identifier context (between whitespace/arrows/parens and
 *    the start of a label or another arrow).
 */
function fixIdentifierHyphens(line: string): string {
  // Quick reject: edges (`-->`) contain hyphens by design. We can't
  // touch any `-` adjacent to `>`. The simplest safe transform is to
  // only rewrite identifiers that match `[A-Za-z0-9][A-Za-z0-9-]*` and
  // are followed by whitespace, `(`, `[`, `{`, `:::`, or end-of-line.
  return line.replace(/(^|[\s\(\)\[\]\{\}|;>])([A-Za-z_][A-Za-z0-9_-]*[A-Za-z0-9])(?=[\s\(\[\{:|;<>=]|$)/g,
    (whole, prefix: string, ident: string) => {
      if (!ident.includes("-")) return whole;
      // Don't touch reserved Mermaid keywords (rare but possible).
      const lower = ident.toLowerCase();
      if (RESERVED.has(lower)) return whole;
      // Don't touch identifiers that are obviously arrow remnants
      // (e.g. `--`, `---`, `-->`); those should never match the
      // outer regex but guard anyway.
      if (/^-+>?$/.test(ident)) return whole;
      return prefix + ident.replace(/-/g, "_");
    });
}

const RESERVED = new Set([
  "graph", "flowchart", "subgraph", "end", "sequencediagram", "participant",
  "actor", "note", "loop", "alt", "else", "opt", "par", "and", "rect",
  "classdiagram", "class", "state", "statediagram", "statediagram-v2",
  "erdiagram", "journey", "gantt", "pie", "requirementdiagram",
  "gitgraph", "mindmap", "timeline", "quadrantchart", "xychart-beta",
  "block-beta", "td", "tb", "bt", "lr", "rl",
]);

/**
 * 3. Escape parentheses inside the FIRST level of square-bracket
 *    labels: `A[Cloud Run (asia-south1)]` → `A["Cloud Run (asia-south1)"]`.
 *    Mermaid's flowchart parser explodes when it sees a `(` inside an
 *    unquoted `[…]` label. The fix is to quote the whole label.
 */
function quoteParenLabels(line: string): string {
  return line.replace(/\[([^\[\]"\n]*\([^\[\]"\n]*\)[^\[\]"\n]*)\]/g,
    (_, inner: string) => `["${inner.replace(/"/g, "'")}"]`);
}

/**
 * 4. Same for `()` labels — `A(My (parens) here)` → `A["My (parens) here"]`.
 *    Mermaid actually allows `(label)` but doesn't allow nested parens
 *    inside. Promote to the bracket form when it contains nested parens.
 */
function quoteNestedParenLabels(line: string): string {
  return line.replace(/(?<![\(])\(([^()"\n]*\([^()"\n]*\)[^()"\n]*)\)/g,
    (_, inner: string) => `["${inner.replace(/"/g, "'")}"]`);
}

/**
 * 5. Strip a leading BOM and any zero-width characters the model
 *    sometimes emits when copying from markdown sources.
 */
function stripInvisibles(src: string): string {
  return src.replace(/^\uFEFF/, "").replace(/[\u200B-\u200F\u202A-\u202E]/g, "");
}

/**
 * 6. Some models prefix `C4Container` / `C4Context` even though we ask
 *    for `flowchart TD`. Demote to `flowchart TD` so it renders — the
 *    visual difference is minor at the architecture-lens scale.
 */
function demoteUnstableC4(src: string): string {
  return src.replace(/^\s*(C4(?:Context|Container|Component|Dynamic))\b.*$/im,
    "flowchart TD");
}

export function sanitizeMermaid(raw: string): string {
  if (!raw) return raw;
  let src = stripInvisibles(raw);
  src = unwrapFences(src);
  src = demoteUnstableC4(src);
  const lines = src.split("\n").map((line) => {
    // Comments pass through untouched.
    if (/^\s*%%/.test(line)) return line;
    let l = line;
    l = quoteNestedParenLabels(l);
    l = quoteParenLabels(l);
    l = fixIdentifierHyphens(l);
    return l;
  });
  return lines.join("\n");
}
