/**
 * Cost-estimate formatting for architecture reports.
 *
 * These are the *cloud running costs* of the designed system (a real,
 * region-independent number — cloud vendors bill in USD globally). Unlike
 * Tessar's own product price, we don't change the amount by region; we
 * only display it in the currency that reads naturally to the viewer:
 * INR for India, USD for everyone else.
 *
 * Pure functions only (no React / no "use client") so the server-side
 * PDF/PPTX renderers can reuse them. Region is passed in by the caller.
 *
 * Schema notes:
 *  - ScaleProfile carries BOTH `monthly_cost_inr_*` and `monthly_cost_usd_*`,
 *    so USD display uses the agent's native USD figures (no conversion).
 *  - CostLineItem carries ONLY `monthly_inr_*`, so USD display converts at
 *    a fixed rate. These are already rough estimate *bands*, so a fixed
 *    rate is acceptable and keeps old reports working with no agent change.
 */
import type { Region } from "./region";
import { USD_TO_INR_CHARGE } from "@/lib/razorpay/packs";

/** Convert a whole-rupee cost figure to whole dollars at the fixed rate. */
export function usdFromInr(inr: number): number {
  if (!Number.isFinite(inr)) return 0;
  return inr / USD_TO_INR_CHARGE;
}

/** Convert a USD figure back to whole rupees at the fixed rate. */
export function inrFromUsd(usd: number): number {
  if (!Number.isFinite(usd)) return 0;
  return Math.round(usd * USD_TO_INR_CHARGE);
}

/** The currency symbol for a region's cost display. */
export function costSymbol(region: Region): "₹" | "$" {
  return region === "INTL" ? "$" : "₹";
}

/** Full grouped amount with symbol, e.g. "₹15,000" or "$180". */
export function formatCost(value: number, region: Region): string {
  if (!Number.isFinite(value)) return "—";
  if (region === "INTL") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Compact amount with symbol for tight chrome, e.g. "₹1.2L", "₹2.5Cr",
 * "$1.8K", "$2.4M". Mirrors the old Indian-grouping compact behaviour and
 * adds K/M for USD.
 */
export function formatCostCompact(value: number, region: Region): string {
  if (!Number.isFinite(value)) return "—";
  if (region === "INTL") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${Math.round(value)}`;
  }
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${Math.round(value)}`;
}

/**
 * A monthly cost band ("₹15,000–₹20,000 / mo" or "$180–$240 / mo") for a
 * CostLineItem-style INR pair. USD is derived from INR at the fixed rate.
 */
export function formatInrBand(
  inrLow: number,
  inrHigh: number,
  region: Region,
): string {
  if (region === "INTL") {
    return `${formatCost(usdFromInr(inrLow), region)}–${formatCost(usdFromInr(inrHigh), region)}`;
  }
  return `${formatCost(inrLow, region)}–${formatCost(inrHigh, region)}`;
}

/**
 * A cost band for a ScaleProfile, which has native USD figures — prefer
 * those for INTL instead of converting.
 */
export function formatScaleBand(
  profile: {
    monthly_cost_inr_low: number;
    monthly_cost_inr_high: number;
    monthly_cost_usd_low: number;
    monthly_cost_usd_high: number;
  },
  region: Region,
): string {
  if (region === "INTL") {
    return `${formatCost(profile.monthly_cost_usd_low, region)}–${formatCost(profile.monthly_cost_usd_high, region)}`;
  }
  return `${formatCost(profile.monthly_cost_inr_low, region)}–${formatCost(profile.monthly_cost_inr_high, region)}`;
}

/**
 * Single safe primitive for the studies cockpit: a value computed in INR
 * by the cost engine, displayed compactly in the viewer's currency
 * (₹1.2L for India, $1.4K for international — converted at the fixed
 * rate). Use this anywhere the engine hands you an INR figure to show.
 */
export function formatCostFromInr(inr: number, region: Region): string {
  return formatCostCompact(region === "INTL" ? usdFromInr(inr) : inr, region);
}

/** The compact currency-symbol-prefixed string for a value already in INR. */
export function costFromInrValue(inr: number, region: Region): number {
  return region === "INTL" ? usdFromInr(inr) : inr;
}
