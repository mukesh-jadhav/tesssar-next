import { getSessionUser } from "@/lib/firebase/auth";
import { CreditPacksGrid } from "@/components/billing/CreditPacksGrid";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, RotateCcw, Headphones } from "lucide-react";

export const metadata = { title: "Pricing" };

export default async function PricingPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-12 md:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-medium uppercase tracking-wider text-brand">Pricing</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Pay per run.</h1>
        <p className="mt-3 text-muted-foreground">
          No subscriptions. No tiers. Buy credits, use them when you have an idea worth designing.
        </p>
      </div>

      <div className="mt-12">
        <CreditPacksGrid signedIn={!!user} />
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <InfoCard icon={<RotateCcw />} title="Refund on failure" desc="If the agent fails to produce a valid architecture, your credit is automatically refunded." />
        <InfoCard icon={<ShieldCheck />} title="Secure payments" desc="Powered by Razorpay. Cards, UPI, netbanking, wallets — all in INR." />
        <InfoCard icon={<Headphones />} title="Human support" desc="Have a question about your run or invoice? Email hello@tessar.app — we reply within a business day." />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand">{icon}</div>
        <div className="mt-3 font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
