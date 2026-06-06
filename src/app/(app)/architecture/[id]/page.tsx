import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { ReportCockpit } from "@/components/workspace/ReportCockpit";
import { ScrollFrame } from "@/components/workspace/ScrollFrame";
import { Architecture, type ArchitectureDoc } from "@/types/architecture";

export default async function ArchitectureResultPage({
  params,
}: {
  params: { id: string };
}) {
  const user = (await getSessionUser())!;
  const snap = await adminDb.collection("architectures").doc(params.id).get();
  if (!snap.exists) notFound();
  const doc = snap.data() as ArchitectureDoc;
  if (doc.uid !== user.uid) redirect("/dashboard");

  if (doc.status === "failed") {
    return (
      <ScrollFrame>
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-2xl border border-[hsl(var(--bad))]/30 bg-[hsl(var(--bad))]/5 p-6">
            <div className="flex items-center gap-2 text-[hsl(var(--bad))]">
              <span className="ms text-[20px]" aria-hidden>warning</span>
              <span className="font-medium">Generation failed</span>
            </div>
            <p className="mt-2 text-[14px] text-[hsl(var(--ink-2))]">{doc.errorMessage ?? "Unknown error"}</p>
            <p className="mt-1 text-[12px] text-[hsl(var(--ink-3))]">Your credit has been refunded.</p>
            <Link href="/new" className="btn-pill-accent btn-pill-sm mt-4 w-fit">Try again</Link>
          </div>
        </div>
      </ScrollFrame>
    );
  }

  if (doc.status !== "complete" || !doc.architecture) {
    return (
      <ScrollFrame>
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="card-paper p-6">
            <div className="font-medium">Still generating…</div>
            <p className="mt-1 text-[14px] text-[hsl(var(--ink-2))]">
              Refresh in a moment, or go back to{" "}
              <Link href="/new" className="underline">start a new run</Link>.
            </p>
          </div>
        </div>
      </ScrollFrame>
    );
  }

  const arch = Architecture.parse(doc.architecture);
  return <ReportCockpit arch={arch} architectureId={doc.id} />;
}
