"use client";

import { CountUp } from "@/components/motion/CountUp";
import { FadeIn } from "@/components/motion/FadeIn";
import { CREDIT_PACKS } from "@/lib/razorpay/packs";
import { useRegion } from "@/components/billing/RegionalPrice";

/**
 * Hero stats row — four count-up tickers. Numbers tick from 0 on viewport
 * entry. Labels use the existing mono eyebrow treatment. The price stat is
 * region-aware: ₹300 for India, the premium USD Solo price elsewhere.
 */
export function HeroStats() {
  const region = useRegion();
  const solo = CREDIT_PACKS[0];
  const priceTo = region === "INTL" ? Math.round(solo.priceUsdCents / 100) : 300;
  const pricePrefix = region === "INTL" ? "$" : "₹";

  return (
    <FadeIn
      delay={0.2}
      className="mt-20 grid grid-cols-2 gap-x-10 gap-y-6 border-t border-[hsl(var(--line))] pt-10 md:grid-cols-4"
    >
      <Stat to={14} label="sections per report" />
      <Stat to={6} suffix="+" label="named diagrams" />
      <Stat to={42} label="cloud patterns" />
      <Stat to={priceTo} prefix={pricePrefix} label="per design" />
    </FadeIn>
  );
}

function Stat({
  to,
  label,
  prefix,
  suffix,
}: {
  to: number;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <CountUp
        to={to}
        prefix={prefix}
        suffix={suffix}
        duration={1.8}
        className="display block text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.02em] leading-none tabular-nums"
      />
      <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[hsl(var(--ink-3))]">
        {label}
      </div>
    </div>
  );
}
