"use client";

import { useEffect, useState } from "react";
import { getPack, CREDIT_PACKS, type CreditPack } from "@/lib/razorpay/packs";
import { formatINR, formatUSD } from "@/lib/utils";
import { detectRegion, type Region } from "@/lib/geo/region";

/**
 * Shared client hook + components for region-aware product pricing.
 *
 * SSR renders the home market (INR) with no flash for Indian visitors;
 * on mount the client upgrades to USD for any non-India timezone. Use
 * these everywhere a *Tessar price* is shown so India sees ₹ and the
 * rest of the world sees the premium USD price — automatically, for all
 * regions (not just the US).
 *
 * NOTE: this is only for Tessar's own pricing. The architecture reports'
 * cloud-cost estimates (monthly_cost_inr) are a different concept and
 * stay in INR.
 */
export function useRegion(): Region {
  const [region, setRegion] = useState<Region>("IN");
  useEffect(() => {
    setRegion(detectRegion());
  }, []);
  return region;
}

/** Format a pack's total or per-design price in the visitor's currency. */
export function packPrice(
  pack: CreditPack,
  region: Region,
  unit = false,
): string {
  if (region === "INTL") {
    return formatUSD(unit ? pack.perDesignUsdCents : pack.priceUsdCents);
  }
  return formatINR(unit ? pack.perDesignPaise : pack.pricePaise);
}

/**
 * Inline region-aware price for a given pack. `unit` shows the per-design
 * price instead of the pack total. Renders nothing if the pack id is bad.
 */
export function Price({
  packId,
  unit = false,
}: {
  packId: string;
  unit?: boolean;
}) {
  const region = useRegion();
  const pack = getPack(packId);
  if (!pack) return null;
  return <>{packPrice(pack, region, unit)}</>;
}

/**
 * One-line summary of the pack ladder for the landing pricing teaser,
 * e.g. "₹300 / design — packs of 3 (₹840), 10 (₹2,500) and 50 (₹10,000
 * — ₹200 each)" or the USD equivalent for international visitors.
 */
export function PacksSummary() {
  const region = useRegion();
  const byId = (id: string) => CREDIT_PACKS.find((p) => p.id === id)!;
  const solo = byId("single");
  const trio = byId("trio");
  const sprint = byId("sprint");
  const studio = byId("deca");
  return (
    <>
      {packPrice(solo, region, true)} / design — packs of {trio.designs} (
      {packPrice(trio, region)}), {sprint.designs} ({packPrice(sprint, region)})
      and {studio.designs} ({packPrice(studio, region)} — {packPrice(studio, region, true)} each)
    </>
  );
}

/**
 * Region-appropriate anchor for the "a freelance architect charges X"
 * comparison on the landing page. Kept as a realistic round figure per
 * market rather than a literal FX conversion.
 */
export function FreelanceRate() {
  const region = useRegion();
  return <>{region === "INTL" ? "$2,000+" : "₹50,000+"}</>;
}
