"use client";

import { useEffect, useState } from "react";
import { CREDIT_PACKS } from "@/lib/razorpay/packs";
import { formatINR, formatUSD } from "@/lib/utils";
import { detectRegion, type Region } from "@/lib/geo/region";

/**
 * Region-aware bits of the pricing hero. India sees the INR Solo price
 * and "prices in INR" note; international visitors see the premium USD
 * Solo price and a "billed in INR at checkout" note. SSR defaults to the
 * home market (INR) and the client upgrades on mount.
 */
function useRegion(): Region {
  const [region, setRegion] = useState<Region>("IN");
  useEffect(() => { setRegion(detectRegion()); }, []);
  return region;
}

const solo = CREDIT_PACKS[0];

/** The "₹300 a design" / "$14 a design" lead line of the pricing h1. */
export function PricingHeroPrice() {
  const region = useRegion();
  const price =
    region === "INTL" ? formatUSD(solo.priceUsdCents) : formatINR(solo.pricePaise);
  return <>{price} a design.</>;
}

/** The small masthead note about currency / billing. */
export function PricingCurrencyNote() {
  const region = useRegion();
  return (
    <span className="eyebrow hidden md:inline">
      {region === "INTL"
        ? "Prices in USD · billed in INR at checkout"
        : "All prices in INR, GST inclusive"}
    </span>
  );
}
