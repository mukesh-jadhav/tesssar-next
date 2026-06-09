"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CREDIT_PACKS, type CreditPack } from "@/lib/razorpay/packs";
import { cn, formatINR } from "@/lib/utils";
import { DrawnUnderline } from "@/components/landing/DrawnUnderline";

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

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Self-healing Razorpay loader. Background-loads on mount, and re-tries
 * on demand at click time if the first load was blocked (ad blocker,
 * flaky network, CSP edge cases). Errors are surfaced to the console
 * and as a toast — the previous version swallowed them, which made
 * "buy button does nothing" indistinguishable from a hung script.
 */
function useRazorpayLoader() {
  const promiseRef = useRef<Promise<boolean> | null>(null);

  const load = useCallback((): Promise<boolean> => {
    if (typeof window === "undefined") return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);
    if (promiseRef.current) return promiseRef.current;

    promiseRef.current = new Promise<boolean>((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${RAZORPAY_SRC}"]`,
      );
      const s = existing ?? document.createElement("script");
      const finish = (ok: boolean) => {
        if (!ok) promiseRef.current = null; // allow retry
        resolve(ok);
      };
      s.addEventListener("load", () => finish(Boolean(window.Razorpay)), { once: true });
      s.addEventListener("error", (e) => {
        console.error("[razorpay] checkout.js failed to load", e);
        finish(false);
      }, { once: true });
      if (!existing) {
        s.src = RAZORPAY_SRC;
        s.async = true;
        document.head.appendChild(s);
      }
    });

    return promiseRef.current;
  }, []);

  useEffect(() => { void load(); }, [load]);

  return load;
}

export function CreditPacksGrid({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const loadRazorpay = useRazorpayLoader();
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

  async function buyPack(pack: CreditPack) {
    if (!signedIn) { router.push("/login?next=/pricing"); return; }
    setLoadingPackId(pack.id);
    try {
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        toast.error(
          "Couldn't load Razorpay checkout. Disable any ad-blocker for tessar.dev and try again.",
        );
        return;
      }
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
      console.error("[razorpay] buyPack error", err);
      toast.error((err as Error).message || "Could not start checkout");
      setLoadingPackId(null);
    }
  }

  return (
    <div className="grid gap-px bg-[hsl(var(--line))] border border-[hsl(var(--line))] sm:grid-cols-2 lg:grid-cols-4">
      {CREDIT_PACKS.map((pack, idx) => {
        const popular = pack.badge === "Most popular";
        const isFree = pack.id === "single";
        return (
          <div
            key={pack.id}
            className={cn(
              "group relative",
              popular && "lg:z-10 lg:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]",
            )}
          >
            <article
              className={cn(
                "relative flex h-full flex-col bg-[hsl(var(--paper))] p-8 md:p-10 transition-colors",
                popular ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]" : "hover:bg-[hsl(var(--paper-2))]",
              )}
            >
              {popular && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-[hsl(var(--accent))]"
                />
              )}
              {isFree && (
                <span className="pointer-events-none absolute -top-3 left-6 z-10 -rotate-[3deg] select-none">
                  <span className="relative inline-flex items-baseline gap-1.5 bg-[hsl(var(--paper))] px-2.5 py-1 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.25)]">
                    <span className="serif italic text-[12px] text-[hsl(var(--ink-2))]">first design</span>
                    <span className="relative font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ink))]">
                      free
                      <DrawnUnderline delay={0.4} thickness={2} className="!-bottom-[2px] !h-[6px]" />
                    </span>
                  </span>
                </span>
              )}
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
                <span
                  className={cn(
                    "display leading-none tracking-[-0.04em] tabular-nums origin-left transition-transform duration-500 ease-out group-hover:scale-[1.025]",
                    popular
                      ? "text-[clamp(3.25rem,6vw,5rem)]"
                      : "text-[clamp(3rem,5.5vw,4.5rem)]",
                  )}
                >
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
                    <span className="ms text-[18px] transition-transform duration-300 group-hover:translate-x-1" aria-hidden>arrow_forward</span>
                  </>
                )}
              </button>
            </article>
          </div>
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
