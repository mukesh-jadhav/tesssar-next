"use client";

import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScaleProfile, ScaleTier } from "@/types/architecture";
import { SCALE_TIER_META } from "@/types/architecture";
import { ArrowUpRight, IndianRupee, Users, Zap, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

const ORDER: ScaleTier[] = ["startup", "growth", "scale", "hyperscale"];

export function ScaleExplorer({ profiles }: { profiles: ScaleProfile[] }) {
  const [idx, setIdx] = useState(1); // default "growth"

  const sorted = useMemo(() => {
    const byTier = new Map(profiles.map((p) => [p.tier, p]));
    return ORDER.map((t) => byTier.get(t)).filter(Boolean) as ScaleProfile[];
  }, [profiles]);

  const current = sorted[idx];
  const meta = current ? SCALE_TIER_META[current.tier] : undefined;

  if (!current || !meta) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Drag to explore scale</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{meta.label}</span>
              <span className="text-sm text-muted-foreground">{meta.description}</span>
            </div>
          </div>
          <Badge variant="brand" className="text-xs">Tier {idx + 1} of 4</Badge>
        </div>
        <Slider
          min={0}
          max={3}
          step={1}
          value={[idx]}
          onValueChange={([v]) => v !== undefined && setIdx(v)}
        />
        <div className="grid grid-cols-4 text-center text-xs text-muted-foreground">
          {ORDER.map((t, i) => (
            <button
              key={t}
              onClick={() => setIdx(i)}
              className={cn(
                "py-1 transition-colors",
                i === idx ? "font-semibold text-foreground" : "hover:text-foreground",
              )}
            >
              {SCALE_TIER_META[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<Users className="size-4" />} label="Users" value={current.expected_users} />
        <MetricCard icon={<Zap className="size-4" />} label="Traffic" value={current.expected_rps} />
        <MetricCard icon={<HardDrive className="size-4" />} label="Storage" value={current.storage_estimate} />
        <MetricCard
          icon={<IndianRupee className="size-4" />}
          label="Monthly cost"
          value={`₹${current.monthly_cost_inr_low.toLocaleString("en-IN")} – ₹${current.monthly_cost_inr_high.toLocaleString("en-IN")}`}
          sub={`$${current.monthly_cost_usd_low}–$${current.monthly_cost_usd_high}`}
        />
      </div>

      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <ArrowUpRight className="size-4 text-brand" />
          Deltas from baseline at <span className="text-brand">{meta.label}</span>
        </div>
        <ul className="space-y-2 text-sm">
          {current.changes_from_baseline.map((c, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span className="text-foreground/90">{c}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-xs text-muted-foreground">
          <div>
            <div className="uppercase tracking-wider">Read/Write ratio</div>
            <div className="mt-1 text-sm font-medium text-foreground">{current.read_write_ratio}</div>
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
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-base font-semibold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}
