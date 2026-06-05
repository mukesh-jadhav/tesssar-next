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
    <div className="flex min-h-screen flex-col bg-m3-surface text-m3-on-surface">
      <LandingTopBar signedIn={false} />
      <main className="flex-1 pt-24">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-14">
          <div className="m3-page-enter mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-m3-surface-container-low p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-m3-primary-container text-m3-on-primary-container">
                <span className="ms text-[20px]" aria-hidden>visibility</span>
              </span>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-m3-on-surface-variant">
                  Sample report
                </div>
                <div className="mt-1 text-[14px] font-medium text-m3-on-surface">
                  An imaginary product, fully designed — to show what Tessar produces.
                </div>
              </div>
            </div>
            <Link
              href="/login"
              className="state-layer press m3-squircle-press inline-flex h-12 items-center gap-2 rounded-2xl bg-m3-primary px-5 text-[14px] font-medium text-m3-on-primary shadow-m3-2 hover:shadow-m3-3"
            >
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
