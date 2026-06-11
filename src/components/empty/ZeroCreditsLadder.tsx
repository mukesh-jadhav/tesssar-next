"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CREDIT_PACKS } from "@/lib/razorpay/packs";
import { formatINR, formatUSD } from "@/lib/utils";
import { detectRegion, type Region } from "@/lib/geo/region";
import { EditorialIllustration } from "@/components/empty/EditorialIllustration";

/**
 * ZeroCreditsLadder — replaces the composer on `/new` when the user is out of
 * credits. Surfaces the four packs in a tight inline grid with a single
 * primary CTA per card. Keeps the editorial frame so it doesn't feel like a
 * paywall — it's the same surface, just out of fuel.
 */
export function ZeroCreditsLadder() {
  // Home-market (INR) by default; client upgrades to USD for non-India.
  const [region, setRegion] = useState<Region>("IN");
  useEffect(() => { setRegion(detectRegion()); }, []);

  return (
    <section className="m3-page-enter mt-12 card-paper px-8 py-14 md:px-16 md:py-20">
      <div className="mx-auto grid w-full max-w-[920px] gap-12 md:grid-cols-[auto_1fr] md:items-center md:gap-16">
        <EditorialIllustration kind="workspace" className="w-[240px] md:w-[300px] mx-auto" />
        <div className="text-center md:text-left">
          <p className="section-num">Out of credits</p>
          <h2 className="display-tight mt-6 text-[clamp(2.2rem,5vw,4rem)] leading-[0.92] tracking-[-0.04em]">
            The studio&apos;s<br />
            <span className="serif font-normal italic accent">ready — your meter isn&apos;t.</span>
          </h2>
          <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.55] text-[hsl(var(--ink-2))] mx-auto md:mx-0">
            Pick a pack to keep designing. Every credit is refunded automatically
            if a run fails, and packs never expire.
          </p>
        </div>
      </div>

      {/* Pack ladder */}
      <div className="mt-14">
        <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-4">
          <p className="section-num">Packs</p>
          <Link href="/pricing" className="eyebrow ulgrow">View full pricing →</Link>
        </div>
        <ul className="mt-2 grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-2 xl:grid-cols-4">
          {CREDIT_PACKS.map((pack) => {
            const popular = pack.badge === "Most popular";
            return (
              <li key={pack.id} className="bg-[hsl(var(--paper))]">
                <Link
                  href={`/pricing#${pack.id}`}
                  className="group block h-full p-6 transition-colors hover:bg-[hsl(var(--paper-2))]"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
                      {pack.name}
                    </p>
                    {pack.badge && (
                      <span
                        className={
                          "font-mono text-[9px] uppercase tracking-[0.18em] " +
                          (popular ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--ink-3))]")
                        }
                      >
                        {pack.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 display tabular-nums text-[clamp(1.6rem,3vw,2.25rem)] tracking-[-0.03em] leading-none">
                    {region === "INTL" ? formatUSD(pack.priceUsdCents) : formatINR(pack.pricePaise)}
                  </div>
                  <div className="mt-2 text-[12px] text-[hsl(var(--ink-2))]">
                    {pack.designs} {pack.designs === 1 ? "design" : "designs"} ·{" "}
                    <span className="tabular-nums">
                      {region === "INTL"
                        ? formatUSD(pack.perDesignUsdCents)
                        : formatINR(pack.perDesignPaise)}
                    </span>{" "}
                    each
                  </div>
                  <div className="mt-6 flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--ink))] group-hover:text-[hsl(var(--accent))] transition-colors">
                    Top up
                    <span className="ms text-[16px] group-hover:translate-x-0.5 transition-transform" aria-hidden>
                      arrow_forward
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[12px] text-[hsl(var(--ink-3))] text-center md:text-left">
          {region === "INTL"
            ? "Secure checkout via Razorpay · international cards accepted · billed in INR."
            : "Secure checkout via Razorpay · UPI, cards, netbanking · GST invoice on request."}
        </p>
      </div>
    </section>
  );
}
