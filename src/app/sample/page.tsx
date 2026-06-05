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

      <main className="pt-[120px] md:pt-[140px]">
        <div className="mx-auto w-full max-w-[1480px] px-6 md:px-12 lg:px-16">
          {/* Sample banner */}
          <div className="m3-page-enter card-paper flex flex-wrap items-center justify-between gap-4 p-5 md:p-7">
            <div className="flex items-center gap-4">
              <span className="tag tag-accent">§ Sample report</span>
              <span className="hidden sm:inline text-[14px] text-[hsl(var(--ink-2))]">
                An imaginary product, fully designed — exactly what you&rsquo;d get.
              </span>
            </div>
            <Link href="/login" className="btn-pill-accent">
              Design yours
              <span className="ms text-[18px]" aria-hidden>arrow_forward</span>
            </Link>
          </div>
        </div>

        <ArchitectureView arch={SAMPLE_ARCHITECTURE} showDownload={false} />
      </main>

      <Footer />
    </div>
  );
}
