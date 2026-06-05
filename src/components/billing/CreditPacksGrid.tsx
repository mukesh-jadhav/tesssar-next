"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CREDIT_PACKS, type CreditPack } from "@/lib/razorpay/packs";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
        theme: { color: "#2563eb" },
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
    <div className="grid gap-4 md:grid-cols-3">
      {CREDIT_PACKS.map((pack, i) => {
        const popular = pack.badge === "Most popular";
        return (
          <div
            key={pack.id}
            className="animate-reveal-up"
            style={{
              animationDelay: `${i * 90}ms`,
              animationFillMode: "both",
            }}
          >
            <Card
              className={cn(
                "card-lift relative flex h-full flex-col",
                popular && "border-foreground/30",
              )}
            >
              {pack.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    className={cn(
                      "px-3 py-1 text-[10px] font-medium uppercase tracking-wider shadow-sm",
                      popular
                        ? "border-transparent bg-foreground text-background"
                        : "",
                    )}
                  >
                    {pack.badge}
                  </Badge>
                </div>
              )}
              <CardContent className="flex flex-1 flex-col p-7">
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {pack.name}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="display text-[clamp(2.25rem,4vw,3rem)] font-semibold tabular-nums leading-none">
                    {formatINR(pack.pricePaise)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {pack.credits} {pack.credits === 1 ? "architecture run" : "architecture runs"} ·{" "}
                  {formatINR(pack.perRunPaise)} / run
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {pack.description}
                </p>
                <ul className="my-7 space-y-2.5 text-sm">
                  <Feature>Full report — diagrams, tiers, costs, risks</Feature>
                  <Feature>Downloadable PDF for stakeholders</Feature>
                  <Feature>Permanent history &amp; versioning</Feature>
                  <Feature>Refund on agent failure</Feature>
                </ul>
                <Button
                  onClick={() => buyPack(pack)}
                  disabled={loadingPackId === pack.id}
                  variant={popular ? "default" : "outline"}
                  className="mt-auto"
                  size="lg"
                >
                  {loadingPackId === pack.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    `Buy ${pack.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
      <span className="text-foreground/80">{children}</span>
    </li>
  );
}
