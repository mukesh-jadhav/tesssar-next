"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CREDIT_PACKS, type CreditPack } from "@/lib/razorpay/packs";
import { cn, formatINR } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, cb: (resp: RazorpayFailureResponse) => void) => void;
    };
  }
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
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
    if (window.Razorpay) { setLoaded(true); return; }
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
    if (!signedIn) { router.push("/login?next=/pricing"); return; }
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
        orderId: string; amount: number; currency: string; keyId: string; txId: string;
        user: { name: string; email: string };
      };

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Tessar",
        description: `${pack.name} — ${pack.designs} ${pack.designs === 1 ? "design" : "designs"}`,
        prefill: { name: data.user.name, email: data.user.email },
        theme: { color: "#E04F1E" },
        modal: { ondismiss: () => setLoadingPackId(null) },
        handler: async (resp) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...resp, txId: data.txId }),
            });
            if (!verifyRes.ok) throw new Error(await verifyRes.text());
            toast.success(`Added ${pack.designs} ${pack.designs === 1 ? "design" : "designs"} to your account.`);
            router.push("/dashboard");
            router.refresh();
          } catch (err) {
            toast.error((err as Error).message || "Verification failed");
          } finally {
            setLoadingPackId(null);
          }
        },
      });
      rzp.on("payment.failed", (resp) => {
        const err = resp?.error;
        const detail = err?.description || err?.reason || err?.code || "Payment failed";
        const tail = err?.metadata?.payment_id ? ` (ref ${err.metadata.payment_id})` : "";
        toast.error(`Razorpay: ${detail}${tail}`);
        console.error("[razorpay] payment.failed", resp);
        setLoadingPackId(null);
      });
      rzp.open();
    } catch (err) {
      toast.error((err as Error).message || "Could not start checkout");
      setLoadingPackId(null);
    }
  }

  return (
    <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] md:grid-cols-3">
      {CREDIT_PACKS.map((pack, idx) => {
        const popular = pack.badge === "Most popular";
        return (
          <article
            key={pack.id}
            className={cn(
              "relative flex flex-col bg-[hsl(var(--paper))] p-8 md:p-10 transition-colors",
              popular ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]" : "hover:bg-[hsl(var(--paper-2))]",
            )}
          >
            <div className="flex items-baseline justify-between">
              <span
                className={cn(
                  "display text-[40px] tracking-[-0.04em]",
                  popular ? "text-[hsl(var(--paper))]/55" : "text-[hsl(var(--ink-3))]",
                )}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              {pack.badge && (
                <span
                  className={cn(
                    "tag",
                    popular
                      ? "!bg-[hsl(var(--accent))] !border-[hsl(var(--accent))] !text-[hsl(var(--paper))]"
                      : "tag-solid",
                  )}
                >
                  {pack.badge}
                </span>
              )}
            </div>

            <div
              className={cn(
                "eyebrow mt-8",
                popular && "!text-[hsl(var(--paper))]/55",
              )}
            >
              {pack.name}
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="display text-[clamp(3rem,5.5vw,4.5rem)] leading-none tracking-[-0.04em] tabular-nums">
                {formatINR(pack.pricePaise)}
              </span>
            </div>
            <div
              className={cn(
                "mt-3 text-[13px] font-mono uppercase tracking-wider tabular-nums",
                popular ? "text-[hsl(var(--paper))]/65" : "text-[hsl(var(--ink-3))]",
              )}
            >
              {pack.designs} {pack.designs === 1 ? "design" : "designs"} · {formatINR(pack.perDesignPaise)} each
            </div>

            <p
              className={cn(
                "mt-5 text-[14px] leading-relaxed",
                popular ? "text-[hsl(var(--paper))]/80" : "text-[hsl(var(--ink-2))]",
              )}
            >
              {pack.description}
            </p>

            <ul className="mt-7 mb-9 space-y-2.5 text-[13px]">
              <Feature popular={popular}>Full report — diagrams, tiers, costs, risks</Feature>
              <Feature popular={popular}>Downloadable PDF for stakeholders</Feature>
              <Feature popular={popular}>Permanent history &amp; versioning</Feature>
              <Feature popular={popular}>Refund on agent failure</Feature>
            </ul>

            <button
              onClick={() => buyPack(pack)}
              disabled={loadingPackId === pack.id}
              className={cn(
                "mt-auto w-full press",
                popular
                  ? "btn-pill btn-pill-accent"
                  : "btn-pill",
                loadingPackId === pack.id && "opacity-60",
              )}
            >
              {loadingPackId === pack.id ? (
                <span className="ms text-[18px] animate-spin" aria-hidden>progress_activity</span>
              ) : (
                <>
                  Buy {pack.name}
                  <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
                </>
              )}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function Feature({ children, popular }: { children: React.ReactNode; popular: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cn(
          "ms mt-0.5 text-[16px]",
          popular ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--ink))]",
        )}
        aria-hidden
      >
        check
      </span>
      <span className={popular ? "text-[hsl(var(--paper))]/85" : "text-[hsl(var(--ink))]"}>
        {children}
      </span>
    </li>
  );
}
