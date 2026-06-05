"use client";

import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScaleProfile, ScaleTier } from "@/types/architecture";
import { SCALE_TIER_META } from "@/types/architecture";
import { ArrowUpRight, IndianRupee, Users, Zap, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/motion";

const ORDER: ScaleTier[] = ["startup", "growth", "scale", "hyperscale"];

export function ScaleExplorer({ profiles }: { profiles: ScaleProfile[] }) {
  const [idx, setIdx] = useState(1);

  const sorted = useMemo(() => {
    const byTier = new Map(profiles.map((p) => [p.tier, p]));
    return ORDER.map((t) => byTier.get(t)).filter(Boolean) as ScaleProfile[];
  }, [profiles]);

  const current = sorted[idx];
  const meta = current ? SCALE_TIER_META[current.tier] : undefined;

  if (!current || !meta) return null;

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Drag to explore scale
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight">
                {meta.label}
              </span>
              <span className="text-sm text-muted-foreground">{meta.description}</span>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
            TIER {idx + 1} / 4
          </Badge>
        </div>
        <Slider
          min={0}
          max={3}
          step={1}
          value={[idx]}
          onValueChange={([v]) => v !== undefined && setIdx(v)}
        />
        <div className="grid grid-cols-4 text-center text-xs">
          {ORDER.map((t, i) => (
            <button
              key={t}
              onClick={() => setIdx(i)}
              className={cn(
                "py-1 transition-all duration-200",
                i === idx
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {SCALE_TIER_META[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="size-4" />}
          label="Users"
          value={current.expected_users}
        />
        <MetricCard
          icon={<Zap className="size-4" />}
          label="Traffic"
          value={current.expected_rps}
        />
        <MetricCard
          icon={<HardDrive className="size-4" />}
          label="Storage"
          value={current.storage_estimate}
        />
        <Card className="card-lift p-5">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <IndianRupee className="size-4" /> Monthly cost
          </div>
          <div className="mt-2.5 text-base font-semibold tracking-tight tabular-nums">
            <AnimatedCounter
              value={current.monthly_cost_inr_low}
              prefix="₹"
              duration={700}
            />
            {" – "}
            <AnimatedCounter
              value={current.monthly_cost_inr_high}
              prefix="₹"
              duration={700}
            />
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            ${current.monthly_cost_usd_low}–${current.monthly_cost_usd_high}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <ArrowUpRight className="size-4" />
          Deltas from baseline at{" "}
          <span className="font-semibold">{meta.label}</span>
        </div>
        <ul className="space-y-2.5 text-sm">
          {current.changes_from_baseline.map((c, i) => (
            <li
              key={`${idx}-${i}`}
              className="flex gap-3 animate-reveal-up"
              style={{
                animationDelay: `${i * 40}ms`,
                animationFillMode: "both",
              }}
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/70" />
              <span className="text-foreground/90">{c}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-xs text-muted-foreground">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em]">Read/Write ratio</div>
            <div className="mt-1.5 text-sm font-medium text-foreground tabular-nums">
              {current.read_write_ratio}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="card-lift p-5">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        key={value}
        className="mt-2.5 text-base font-semibold tracking-tight animate-reveal-up"
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}
