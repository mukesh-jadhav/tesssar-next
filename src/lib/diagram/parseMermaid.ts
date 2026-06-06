/**
 * Lightweight Mermaid parser tuned for the diagrams Tessar produces.
 *
 * Handles three top-level kinds:
 *   - flowchart  TD|TB|LR (with `subgraph` groups, edge labels, chained edges)
 *   - sequenceDiagram (participant aliases, ->>, -->>, Note over)
 *   - erDiagram (entity blocks with fields, relationships)
 *
 * Returns typed graph data the editorial renderer can lay out itself.
 *
 * This is NOT a full Mermaid parser — it intentionally rejects exotic
 * syntax. The agent prompt and the sample data both author within the
 * subset listed above.
 */

export type Direction = "TD" | "TB" | "LR" | "RL" | "BT";

export type FlowNode = {
  id: string;
  label: string;
  shape: "rect" | "round" | "stadium" | "subroutine" | "cylinder" | "rhombus";
  group?: string; // subgraph id this node belongs to
  cls?: string;   // classDef name (we strip these but keep the hint)
};

export type FlowEdge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

export type FlowGroup = {
  id: string;
  label: string;
  parent?: string;
};

export type FlowGraph = {
  kind: "flow";
  direction: Direction;
  nodes: FlowNode[];
  edges: FlowEdge[];
  groups: FlowGroup[];
};

export type SequenceMessage = {
  from: string;
  to: string;
  text: string;
  dashed: boolean; // -->> = dashed (response)
  selfLoop?: boolean;
};

export type SequenceNote = {
  text: string;
  over: string[]; // participant ids the note spans
};

export type SequenceItem =
  | { kind: "msg"; msg: SequenceMessage }
  | { kind: "note"; note: SequenceNote };

export type SequenceGraph = {
  kind: "sequence";
  participants: { id: string; label: string }[];
  items: SequenceItem[];
};

export type ErField = { name: string; type: string; key?: "PK" | "FK"; notes?: string };
export type ErEntity = { id: string; fields: ErField[] };
export type ErRelation = {
  from: string;
  to: string;
  fromCard: string; // e.g. "||"
  toCard: string;   // e.g. "o{"
  label?: string;
};

export type ErGraph = {
  kind: "er";
  entities: ErEntity[];
  relations: ErRelation[];
};

export type Graph = FlowGraph | SequenceGraph | ErGraph | { kind: "unknown"; reason: string };

// ───────────────────────── entry ─────────────────────────

export function parseMermaid(src: string): Graph {
  const trimmed = src.trim();
  const head = trimmed.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (/^sequenceDiagram\b/i.test(head)) return parseSequence(trimmed);
  if (/^erDiagram\b/i.test(head)) return parseEr(trimmed);
  if (/^(flowchart|graph)\b/i.test(head)) return parseFlow(trimmed);
  return { kind: "unknown", reason: `Unrecognised header: "${head}"` };
}

// ───────────────────────── flowchart ─────────────────────────

const SHAPE_TOKENS: { open: string; close: string; shape: FlowNode["shape"] }[] = [
  { open: "([", close: "])",   shape: "stadium"     }, // round caps
  { open: "[(", close: ")]",   shape: "cylinder"    }, // db
  { open: "[[", close: "]]",   shape: "subroutine"  }, // queue / boxed
  { open: "(",  close: ")",    shape: "round"       },
  { open: "{",  close: "}",    shape: "rhombus"     }, // diamond
  { open: "[",  close: "]",    shape: "rect"        }, // default
];

function parseFlow(src: string): FlowGraph {
  const lines = src.split(/\r?\n/);
  const head = lines.shift() ?? "";
  const direction = (head.match(/\b(TD|TB|LR|RL|BT)\b/)?.[1] as Direction) ?? "TD";

  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const groups: FlowGroup[] = [];
  const groupStack: string[] = [];

  const ensureNode = (id: string, label?: string, shape?: FlowNode["shape"]): FlowNode => {
    let n = nodes.get(id);
    if (!n) {
      n = { id, label: label ?? id, shape: shape ?? "rect" };
      nodes.set(id, n);
    } else if (label && (n.label === id || !n.label)) {
      n.label = label;
      if (shape) n.shape = shape;
    }
    if (groupStack.length) n.group = groupStack[groupStack.length - 1];
    return n;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("%%")) continue;
    if (/^classDef\b/i.test(line)) continue;
    if (/^class\b/i.test(line)) continue;
    if (/^style\b/i.test(line)) continue;
    if (/^linkStyle\b/i.test(line)) continue;

    // subgraph X[Label] / subgraph X "Label" / subgraph X
    const sg = line.match(/^subgraph\s+([A-Za-z0-9_]+)(?:\s*\[(.+?)\])?\s*$/i);
    if (sg) {
      const id = sg[1];
      const label = sg[2] ?? id.replace(/_/g, " ");
      groups.push({
        id,
        label: cleanLabel(label),
        parent: groupStack[groupStack.length - 1],
      });
      groupStack.push(id);
      continue;
    }
    if (/^end\b/i.test(line)) {
      groupStack.pop();
      continue;
    }
    if (/^direction\s+/i.test(line)) continue;

    parseFlowLine(line, ensureNode, edges);
  }

  return {
    kind: "flow",
    direction,
    nodes: Array.from(nodes.values()),
    edges,
    groups,
  };
}

/** Parse one logical flowchart line (which can contain a chain of edges). */
function parseFlowLine(
  line: string,
  ensureNode: (id: string, label?: string, shape?: FlowNode["shape"]) => FlowNode,
  edges: FlowEdge[],
) {
  // Split the line into a sequence of NODE / EDGE tokens.
  // A node token is `id[label]`/`id(label)`/...; an edge token is one of:
  //   -->, -.->, ==>, ---, -- text -->, -.- text -.->, ==>|text|, -->|text|
  // The simplest robust approach: walk the string left-to-right.
  const tokens: ({ kind: "node"; node: FlowNode } | { kind: "edge"; edge: { label?: string; dashed: boolean } })[] = [];
  let i = 0;

  const skipWs = () => {
    while (i < line.length && /\s/.test(line[i])) i++;
  };

  while (i < line.length) {
    skipWs();
    if (i >= line.length) break;

    // Edge token?
    const edgeMatch = matchEdge(line, i);
    if (edgeMatch) {
      tokens.push({ kind: "edge", edge: { label: edgeMatch.label, dashed: edgeMatch.dashed } });
      i = edgeMatch.end;
      continue;
    }

    // Node token: starts with an id char.
    const idMatch = /^([A-Za-z_][A-Za-z0-9_-]*)/.exec(line.slice(i));
    if (!idMatch) {
      // Not parseable — skip char to avoid infinite loop.
      i++;
      continue;
    }
    const id = idMatch[1];
    let cursor = i + id.length;

    // Optional shape brackets.
    let label: string | undefined;
    let shape: FlowNode["shape"] | undefined;
    for (const t of SHAPE_TOKENS) {
      if (line.slice(cursor, cursor + t.open.length) === t.open) {
        const closeAt = line.indexOf(t.close, cursor + t.open.length);
        if (closeAt >= 0) {
          label = cleanLabel(line.slice(cursor + t.open.length, closeAt));
          shape = t.shape;
          cursor = closeAt + t.close.length;
        }
        break;
      }
    }

    // Optional :::class
    let cls: string | undefined;
    const clsMatch = /^:::([A-Za-z_][A-Za-z0-9_-]*)/.exec(line.slice(cursor));
    if (clsMatch) {
      cls = clsMatch[1];
      cursor += clsMatch[0].length;
    }

    const node = ensureNode(id, label, shape);
    if (cls) node.cls = cls;
    tokens.push({ kind: "node", node });
    i = cursor;
  }

  // Now reduce: NODE EDGE NODE EDGE NODE … into edges.
  for (let k = 0; k + 2 < tokens.length; k += 2) {
    const a = tokens[k];
    const e = tokens[k + 1];
    const b = tokens[k + 2];
    if (a.kind !== "node" || e.kind !== "edge" || b.kind !== "node") continue;
    edges.push({
      from: a.node.id,
      to: b.node.id,
      label: e.edge.label,
      dashed: e.edge.dashed || undefined,
    });
  }
}

function matchEdge(line: string, at: number): { label?: string; dashed: boolean; end: number } | null {
  const rest = line.slice(at);

  // Variants:
  //   `A --> B`             (no label)              -- match this FIRST so chained edges (`A --> B --> C`) don't swallow B as a label
  //   `A -->|text| B`       (label after arrow)
  //   `A -.-> B`            (dashed)
  //   `A ==> B`             (thick — solid)
  //   `A -- text --> B`     (label between dashes)
  //   `A -. text .-> B`     (dashed with label)
  //   `A == text ==> B`     (thick with label)
  //   `A --- B` / `A === B` (no arrowhead)

  // Case A: complete arrow first (must come before the labeled form).
  let m = rest.match(/^(--?>|-\.->|=+>)\s*(?:\|([^|]+)\|\s*)?/);
  if (m) {
    const arrow = m[1];
    const dashed = arrow === "-.->";
    const label = m[2]?.trim() || undefined;
    return { label, dashed, end: at + m[0].length };
  }
  // Case B: labeled form `-- text --> ` / `-. text .-> ` / `== text ==> `.
  m = rest.match(/^(--|==|-\.)\s+([^|\n]+?)\s+(--?>|\.->|=+>)/);
  if (m) {
    const start = m[1];
    const arrow = m[3];
    const dashed = start === "-." || arrow === ".->";
    const label = m[2].trim() || undefined;
    return { label, dashed, end: at + m[0].length };
  }
  // Case C: `---` (no arrowhead)
  m = rest.match(/^(---|===)\s*/);
  if (m) {
    return { label: undefined, dashed: false, end: at + m[0].length };
  }
  return null;
}

function cleanLabel(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/&nbsp;/gi, " ")
    .replace(/^"(.*)"$/, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// ───────────────────────── sequence ─────────────────────────

function parseSequence(src: string): SequenceGraph {
  const lines = src.split(/\r?\n/).slice(1); // skip header
  const participants = new Map<string, { id: string; label: string }>();
  const items: SequenceItem[] = [];

  const ensure = (id: string, label?: string) => {
    if (!participants.has(id)) participants.set(id, { id, label: label ?? id });
    else if (label) participants.get(id)!.label = label;
    return participants.get(id)!;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("%%")) continue;

    let m = line.match(/^(?:participant|actor)\s+([A-Za-z0-9_]+)(?:\s+as\s+(.+))?$/i);
    if (m) { ensure(m[1], m[2]?.trim()); continue; }

    m = line.match(/^Note\s+(?:over|left of|right of)\s+([^:]+):\s*(.+)$/i);
    if (m) {
      const ids = m[1].split(",").map((s) => s.trim()).filter(Boolean);
      ids.forEach((id) => ensure(id));
      items.push({ kind: "note", note: { text: cleanLabel(m[2]), over: ids } });
      continue;
    }

    // Message: A->>B: text  /  A-->>B: text  /  A->B: text
    m = line.match(/^([A-Za-z0-9_]+)\s*(->>|-->>|->|-->)\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/);
    if (m) {
      const from = m[1], arrow = m[2], to = m[3], text = cleanLabel(m[4]);
      ensure(from);
      ensure(to);
      const dashed = arrow.startsWith("--");
      items.push({
        kind: "msg",
        msg: { from, to, text, dashed, selfLoop: from === to },
      });
      continue;
    }
  }

  return {
    kind: "sequence",
    participants: Array.from(participants.values()),
    items,
  };
}

// ───────────────────────── er ─────────────────────────

function parseEr(src: string): ErGraph {
  const text = src.replace(/^\s*erDiagram\s*/i, "");
  const entities = new Map<string, ErEntity>();
  const relations: ErRelation[] = [];

  const ensure = (id: string) => {
    if (!entities.has(id)) entities.set(id, { id, fields: [] });
    return entities.get(id)!;
  };

  // Walk the source: split on lines but recognise `ENTITY { ... }` blocks
  // even when they span multiple lines.
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Entity block: NAME { ...fields... }
    const blockStart = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*\{\s*$/);
    if (blockStart) {
      const ent = ensure(blockStart[1].toUpperCase());
      while (++i < lines.length) {
        const fline = lines[i].trim();
        if (fline === "}") break;
        if (!fline) continue;
        const f = fline.match(/^(\S+)\s+(\S+)(?:\s+(PK|FK))?(?:\s+"([^"]*)")?\s*$/);
        if (f) ent.fields.push({ type: f[1], name: f[2], key: f[3] as "PK" | "FK" | undefined, notes: f[4] });
      }
      continue;
    }

    // Relation: A ||--o{ B : label
    const rel = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s+([|}o(){]+)--([|}o(){]+)\s+([A-Za-z_][A-Za-z0-9_-]*)\s*(?::\s*(.+))?$/);
    if (rel) {
      const from = rel[1].toUpperCase();
      const to = rel[4].toUpperCase();
      ensure(from);
      ensure(to);
      relations.push({
        from,
        to,
        fromCard: rel[2],
        toCard: rel[3],
        label: rel[5]?.trim(),
      });
    }
  }

  return { kind: "er", entities: Array.from(entities.values()), relations };
}
