import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ArchitectureView } from "@/components/architecture/ArchitectureView";
import { SAMPLE_ARCHITECTURE } from "@/lib/samples/scribestack";
import { Reveal } from "@/components/motion";

export const metadata = {
  title: "Sample report",
  description:
    "See what Tessar produces. A complete, principal-grade cloud architecture for a sample product.",
};

export default function SamplePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader signedIn={false} />
      <main className="flex-1">
        <div className="container max-w-7xl py-10 md:py-14">
          <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card/60 p-5 backdrop-blur">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Sample report
              </div>
              <div className="mt-1.5 text-base font-medium">
                Generated for an imaginary product to show the depth of every Tessar report.
              </div>
            </div>
            <Link
              href="/login"
              className="group/cta inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors"
            >
              Design yours
              <span className="transition-transform duration-200 group-hover/cta:translate-x-0.5">
                →
              </span>
            </Link>
          </Reveal>
          <ArchitectureView arch={SAMPLE_ARCHITECTURE} showDownload={false} />
        </div>
      </main>
    </div>
  );
}
