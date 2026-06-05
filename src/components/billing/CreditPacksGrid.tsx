"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CREDIT_PACKS, type CreditPack } from "@/lib/razorpay/packs";
import { cn, formatINR } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  handler: (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setLoaded(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => setLoaded(true);
    s.onerror = () => toast.error("Could not load Razorpay");
    document.body.appendChild(s);
  }, []);
  return loaded;
}

export function CreditPacksGrid({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const razorpayLoaded = useRazorpayScript();
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

  async function buyPack(pack: CreditPack) {
    if (!signedIn) {
      router.push("/login?next=/pricing");
      return;
    }
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error("Razorpay still loading. Try again in a moment.");
      return;
    }
    setLoadingPackId(pack.id);
    try {
      const res = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        txId: string;
        user: { name: string; email: string };
      };

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Tessar",
        description: `${pack.name} — ${pack.credits} architecture ${pack.credits === 1 ? "run" : "runs"}`,
        prefill: { name: data.user.name, email: data.user.email },
        theme: { color: "#5b3df6" },
        modal: { ondismiss: () => setLoadingPackId(null) },
        handler: async (resp) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...resp, txId: data.txId }),
            });
            if (!verifyRes.ok) throw new Error(await verifyRes.text());
            toast.success(`Added ${pack.credits} ${pack.credits === 1 ? "credit" : "credits"} to your account.`);
            router.push("/dashboard");
            router.refresh();
          } catch (err) {
            toast.error((err as Error).message || "Verification failed");
          } finally {
            setLoadingPackId(null);
          }
        },
      });
      rzp.open();
    } catch (err) {
      toast.error((err as Error).message || "Could not start checkout");
      setLoadingPackId(null);
    }
  }

  return (
    <div className="m3-stagger grid gap-4 md:grid-cols-3">
      {CREDIT_PACKS.map((pack) => {
        const popular = pack.badge === "Most popular";
        const tone = popular ? "primary" : pack.credits >= 10 ? "tertiary" : "secondary";
        const toneSurface =
          tone === "primary"
            ? "bg-m3-primary text-m3-on-primary"
            : tone === "tertiary"
              ? "bg-m3-tertiary-container text-m3-on-tertiary-container"
              : "bg-m3-secondary-container text-m3-on-secondary-container";
        const accent =
          tone === "primary"
            ? "bg-m3-primary-container text-m3-on-primary-container"
            : tone === "tertiary"
              ? "bg-m3-tertiary text-m3-on-tertiary"
              : "bg-m3-secondary text-m3-on-secondary";

        return (
          <article
            key={pack.id}
            className={cn(
              "relative overflow-hidden rounded-[32px] p-7",
              "transition-all duration-m3-default-effects ease-m3-default-effects",
              "hover:-translate-y-1 hover:shadow-m3-3",
              popular ? "bg-m3-surface-container-high shadow-m3-2" : "bg-m3-surface-container-low",
            )}
          >
            {/* Floating decoration */}
            <div
              aria-hidden
              className={cn(
                "absolute -right-12 -top-12 size-44 rounded-[42%_58%_67%_33%/41%_44%_56%_59%] opacity-60 m3-blob",
                accent,
              )}
            />

            {pack.badge && (
              <div className="relative mb-4 inline-flex items-center gap-1.5 rounded-full bg-m3-on-surface px-3 py-1 text-[11px] font-medium text-m3-surface">
                <span className="ms text-[14px]" aria-hidden>star</span>
                {pack.badge}
              </div>
            )}

            <div className="relative text-[11px] font-medium uppercase tracking-[0.16em] text-m3-on-surface-variant">
              {pack.name}
            </div>
            <div className="relative mt-3 flex items-baseline gap-1">
              <span className="display text-[clamp(2.5rem,4.2vw,3.25rem)] leading-none tabular-nums">
                {formatINR(pack.pricePaise)}
              </span>
            </div>
            <div className="relative mt-2 text-[13px] text-m3-on-surface-variant">
              {pack.credits} {pack.credits === 1 ? "design" : "designs"} ·{" "}
              {formatINR(pack.perRunPaise)} / design
            </div>

            <p className="relative mt-5 text-[14px] leading-relaxed text-m3-on-surface-variant">
              {pack.description}
            </p>

            <ul className="relative my-7 space-y-2.5 text-[13px]">
              <Feature>Full report — diagrams, tiers, costs, risks</Feature>
              <Feature>Downloadable PDF for stakeholders</Feature>
              <Feature>Permanent history &amp; versioning</Feature>
              <Feature>Refund on agent failure</Feature>
            </ul>

            <button
              onClick={() => buyPack(pack)}
              disabled={loadingPackId === pack.id}
              className={cn(
                "state-layer press m3-squircle-press relative inline-flex h-12 w-full items-center justify-center gap-2 text-[14px] font-medium shadow-m3-1 transition-shadow duration-m3-default-effects ease-m3-default-effects hover:shadow-m3-2",
                toneSurface,
                loadingPackId === pack.id && "opacity-60",
              )}
            >
              {loadingPackId === pack.id ? (
                <span className="ms animate-spin" aria-hidden>progress_activity</span>
              ) : (
                <>
                  <span className="ms text-[18px]" aria-hidden>shopping_bag</span>
                  Buy {pack.name}
                </>
              )}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="ms mt-0.5 text-[16px] text-m3-primary" aria-hidden>check_circle</span>
      <span className="text-m3-on-surface">{children}</span>
    </li>
  );
}
