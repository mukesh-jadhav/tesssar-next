"use client";

import { CREDIT_PACKS } from "@/lib/razorpay/packs";
import { cn } from "@/lib/utils";
import { useRegion, packPrice } from "@/components/billing/RegionalPrice";
import type { Region } from "@/lib/geo/region";

type Row = {
  label: string;
  /** One value per pack, in CREDIT_PACKS order. */
  values: (string | boolean)[];
  /** Mono-render numeric values. */
  mono?: boolean;
};

const BASELINE_PAISE = CREDIT_PACKS[0]?.perDesignPaise ?? 30_000;

function buildRows(region: Region): Row[] {
  return [
    {
      label: "Designs included",
      values: CREDIT_PACKS.map((p) => String(p.designs)),
      mono: true,
    },
    {
      label: "Per-design price",
      values: CREDIT_PACKS.map((p) => packPrice(p, region, true)),
      mono: true,
    },
    {
      label: "Bulk discount",
      values: CREDIT_PACKS.map((p) => {
        const diff = (BASELINE_PAISE - p.perDesignPaise) / BASELINE_PAISE;
        return diff <= 0 ? "—" : `${Math.round(diff * 100)}% off`;
      }),
      mono: true,
    },
    {
      label: "Full report — diagrams, tiers, costs, risks",
      values: CREDIT_PACKS.map(() => true),
    },
    {
      label: "Downloadable PDF",
      values: CREDIT_PACKS.map(() => true),
    },
    {
      label: "Permanent history & versioning",
      values: CREDIT_PACKS.map(() => true),
    },
    {
      label: "Refund on agent failure",
      values: CREDIT_PACKS.map(() => true),
    },
    {
      label: "Credits never expire",
      values: CREDIT_PACKS.map(() => true),
    },
    {
      label:
        region === "INTL"
          ? "Tax invoice on request"
          : "GST-inclusive INR invoice",
      values: CREDIT_PACKS.map(() => true),
    },
  ];
}

export function ComparisonMatrix() {
  const region = useRegion();
  const rows = buildRows(region);
  return (
    <div className="-mx-6 md:mx-0 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-y border-[hsl(var(--line))]">
            <th className="py-5 pl-6 md:pl-8 pr-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--ink-3))] font-normal w-[40%]">
              What you get
            </th>
            {CREDIT_PACKS.map((p) => {
              const popular = p.badge === "Most popular";
              return (
                <th
                  key={p.id}
                  scope="col"
                  className={cn(
                    "py-5 px-4 align-bottom font-normal",
                    popular && "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]",
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-[0.2em]",
                        popular ? "text-[hsl(var(--paper))]/55" : "text-[hsl(var(--ink-3))]",
                      )}
                    >
                      {popular ? "Popular" : "Pack"}
                    </span>
                    <span className="display text-[22px] tracking-[-0.02em]">
                      {p.name}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row.label}
              className="border-b border-[hsl(var(--line))] last:border-b-0"
            >
              <th
                scope="row"
                className={cn(
                  "py-4 pl-6 md:pl-8 pr-4 font-normal text-[14px] text-[hsl(var(--ink))]",
                  ri % 2 === 1 && "bg-[hsl(var(--paper-2))]",
                )}
              >
                {row.label}
              </th>
              {row.values.map((v, ci) => {
                const popular = CREDIT_PACKS[ci]?.badge === "Most popular";
                return (
                  <td
                    key={ci}
                    className={cn(
                      "py-4 px-4 text-[14px]",
                      ri % 2 === 1 && !popular && "bg-[hsl(var(--paper-2))]",
                      popular && "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]",
                      row.mono && "font-mono tabular-nums",
                    )}
                  >
                    {typeof v === "boolean" ? (
                      v ? (
                        <span
                          aria-label="Included"
                          className={cn(
                            "ms text-[18px]",
                            popular ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--ink))]",
                          )}
                        >
                          check
                        </span>
                      ) : (
                        <span
                          aria-label="Not included"
                          className={cn(
                            "text-[hsl(var(--ink-3))]",
                            popular && "text-[hsl(var(--paper))]/40",
                          )}
                        >
                          —
                        </span>
                      )
                    ) : (
                      <span
                        className={cn(
                          popular && "text-[hsl(var(--paper))]",
                        )}
                      >
                        {v}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
