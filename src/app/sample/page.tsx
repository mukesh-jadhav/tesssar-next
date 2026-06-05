import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArchitectureView } from "@/components/architecture/ArchitectureView";
import { SAMPLE_ARCHITECTURE } from "@/lib/samples/scribestack";
import { ArrowRight, Sparkles } from "lucide-react";

export const metadata = {
  title: "Sample report",
  description: "See what Tessar produces. A complete, principal-grade cloud architecture for a sample product.",
};

export default function SamplePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Badge variant="brand" className="hidden gap-1.5 px-2.5 py-1 sm:inline-flex">
              <Sparkles className="size-3" /> Sample report
            </Badge>
            <Button asChild variant="brand" className="gap-2">
              <Link href="/login">Design yours <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-7xl py-10">
          <div className="mb-6 rounded-lg border border-dashed border-brand/40 bg-brand/5 p-4 text-sm">
            <span className="font-medium">This is a sample</span> — generated for an imaginary product to show you the
            depth and structure of every Tessar report. Sign in to design one for your real idea.
          </div>
          <ArchitectureView arch={SAMPLE_ARCHITECTURE} showDownload={false} />
        </div>
      </main>
    </div>
  );
}
