import Link from "next/link";
import { LandingTopBar } from "@/components/landing/LandingTopBar";
import { ArchitectureView } from "@/components/architecture/ArchitectureView";
import { SAMPLE_ARCHITECTURE } from "@/lib/samples/scribestack";
import { Footer } from "@/components/shared/Footer";

export const metadata = {
  title: "Sample report",
  description:
    "See what Tessar produces. A complete, principal-grade cloud architecture for a sample product.",
};

export default function SamplePage() {
  return (
    <div className="grain min-h-screen bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      <LandingTopBar signedIn={false} />

      <main className="pt-[88px] md:pt-[96px]">
        {/* Slim sample strip — full bleed, sits flush above the report */}
        <div className="border-y border-[hsl(var(--line))] bg-[hsl(var(--paper-2))]">
          <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-20 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <span className="tag tag-accent">§ Sample report</span>
              <span className="hidden sm:inline text-[13px] text-[hsl(var(--ink-2))] truncate">
                An imaginary product, fully designed — exactly what you&rsquo;d get.
              </span>
            </div>
            <Link href="/login" className="btn-pill-accent btn-pill-sm shrink-0">
              Design yours
              <span className="ms text-[16px]" aria-hidden>arrow_forward</span>
            </Link>
          </div>
        </div>

        <ArchitectureView arch={SAMPLE_ARCHITECTURE} showDownload={false} />
      </main>

      <Footer />
    </div>
  );
}
