import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { ReportCockpit } from "@/components/workspace/ReportCockpit";
import { TessarLogo } from "@/components/shared/TessarLogo";
import { Architecture, type ArchitectureDoc } from "@/types/architecture";
import { isValidShareSlug } from "@/lib/architectures/share";
import { clientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const d = await loadBySlug(params.slug);
  if (!d?.architecture) return { title: "Shared design · Tessar" };
  const arch = Architecture.safeParse(d.architecture);
  const title = arch.success ? arch.data.meta.title : "Shared design";
  return {
    title: `${title} · Tessar`,
    description: arch.success ? arch.data.executive_summary.slice(0, 180) : undefined,
  };
}

export default async function PublicReportPage({
  params,
}: {
  params: { slug: string };
}) {
  // Public route \u2014 enforce a per-IP rate limit before touching Firestore
  // so a single legitimate slug can't be hammered for unlimited reads.
  const ip = clientIp({ headers: headers() });
  const guard = rateLimit({
    key: `share-view:ip:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!guard.ok) notFound();

  const d = await loadBySlug(params.slug);
  if (!d || !d.architecture) notFound();
  const arch = Architecture.parse(d.architecture);

  return (
    <div className="flex h-screen flex-col bg-[hsl(var(--paper))]">
      {/* Public-share top strip — replaces the workspace shell */}
      <header className="shrink-0 flex items-center justify-between border-b border-[hsl(var(--line))] px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <TessarLogo className="h-6 w-auto" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
            Shared design
          </span>
        </Link>
        <Link
          href="/"
          className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] px-3 py-1.5 text-[12px] text-[hsl(var(--ink-2))] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))] transition-colors"
        >
          Design your own
          <span className="ms text-[16px]" aria-hidden>arrow_forward</span>
        </Link>
      </header>
      <div className="flex-1 min-h-0">
        <ReportCockpit arch={arch} showDownload={false} />
      </div>
    </div>
  );
}

async function loadBySlug(slug: string): Promise<ArchitectureDoc | null> {
  if (!isValidShareSlug(slug)) return null;
  const snap = await adminDb
    .collection("architectures")
    .where("publicShare.slug", "==", slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0]!.data() as ArchitectureDoc;
}
