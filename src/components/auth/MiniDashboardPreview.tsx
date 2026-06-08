import { cn } from "@/lib/utils";

/**
 * Editorial preview of what users see after sign-in.
 * Pure static markup — no live data, no client JS. Sized to match
 * the LoginPage left column gracefully on md+.
 */
export function MiniDashboardPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.18)]",
        className,
      )}
      aria-hidden
    >
      {/* faux browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 px-3 py-2">
        <span className="size-2 rounded-full bg-[hsl(var(--ink-3))]/40" />
        <span className="size-2 rounded-full bg-[hsl(var(--ink-3))]/40" />
        <span className="size-2 rounded-full bg-[hsl(var(--ink-3))]/40" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
          tessar.dev / dashboard
        </span>
      </div>

      <div className="grid grid-cols-[88px_1fr]">
        {/* faux sidebar */}
        <div className="flex flex-col items-center gap-3 border-r border-[hsl(var(--line))] bg-[hsl(var(--paper))] py-4">
          <span className="grid size-8 place-items-center rounded-xl bg-[hsl(var(--ink))] text-[hsl(var(--paper))] text-[12px]">T</span>
          {["home", "edit_note", "auto_stories", "savings"].map((icon, i) => (
            <span
              key={icon}
              className={cn(
                "grid size-8 place-items-center rounded-xl text-[hsl(var(--ink-2))]",
                i === 0 && "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]",
              )}
            >
              <span className="ms text-[16px]">{icon}</span>
            </span>
          ))}
        </div>

        {/* faux content */}
        <div className="p-4">
          {/* Row 1 — masthead */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--ink-3))]">Workspace</div>
              <div className="display text-[16px] mt-1 leading-none">Good morning, Priya.</div>
            </div>
            <div className="font-mono text-[10px] text-[hsl(var(--ink-3))] tabular-nums">
              <span className="accent">40</span> credits
            </div>
          </div>

          {/* Row 2 — three architecture cards */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { kind: "vault", color: "var(--accent)" },
              { kind: "stream", color: "var(--ink)" },
              { kind: "queue", color: "var(--ink-3)" },
            ].map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]/60 p-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: `hsl(${c.color})` }}
                  />
                  <span className="font-mono text-[8px] text-[hsl(var(--ink-3))]">
                    {i === 0 ? "12m ago" : i === 1 ? "yesterday" : "wk ago"}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-3/4 rounded bg-[hsl(var(--ink))]/60" />
                <div className="mt-1 h-1 w-1/2 rounded bg-[hsl(var(--ink-3))]/30" />
                <div className="mt-2 flex gap-0.5">
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <span key={s} className="h-1 flex-1 rounded bg-[hsl(var(--line))]" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Row 3 — fake quick stats */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { l: "designs", v: "3" },
              { l: "diagrams", v: "18" },
              { l: "spend", v: "—" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-lg border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-2"
              >
                <div className="display text-[14px] leading-none tracking-[-0.02em]">{s.v}</div>
                <div className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[hsl(var(--ink-3))]">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
