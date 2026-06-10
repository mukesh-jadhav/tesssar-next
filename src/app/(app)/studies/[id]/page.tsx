import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { reapStudyIfStuck } from "@/lib/agent/studies";
import { Architecture, type ArchitectureDoc } from "@/types/architecture";
import type { StudyDoc } from "@/types/study";
import { StudyLive } from "@/components/studies/StudyLive";
import {
  StudyCockpit,
  type CockpitVariant,
} from "@/components/studies/cockpit/StudyCockpit";

export default async function StudyResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/studies/${id}`);

  const snap = await adminDb.collection("studies").doc(id).get();
  if (!snap.exists) notFound();
  const raw = snap.data() as StudyDoc;
  if (raw.uid !== user.uid) redirect("/dashboard");

  const initial = await reapStudyIfStuck(raw);

  const hasAnyComplete = initial.variants.some((v) => v.status === "complete");
  const terminal =
    initial.status === "complete" ||
    initial.status === "partial" ||
    initial.status === "failed";

  // Cockpit needs at least one ready variant to be meaningful. Failed-only
  // studies fall through to StudyLive, which renders the empty-state CTA.
  if (terminal && hasAnyComplete) {
    const variants = await loadCockpitVariants(initial, user.uid);
    return <StudyCockpit study={initial} variants={variants} />;
  }

  return <StudyLive initial={initial} />;
}

/**
 * Hydrate the cockpit with each variant's parsed `Architecture`. Failed
 * variants stay as slots with `architecture: null` so the column grid
 * keeps its shape and the user can re-run from the header.
 *
 * Ownership re-check on each arch doc — defense in depth in case a study
 * variant points at a runId the user doesn't own (shouldn't happen, but
 * if it ever does, fail closed).
 */
async function loadCockpitVariants(
  study: StudyDoc,
  uid: string,
): Promise<CockpitVariant[]> {
  const snaps = await Promise.all(
    study.variants.map((v) =>
      adminDb.collection("architectures").doc(v.runId).get(),
    ),
  );
  return study.variants.map((v, i) => {
    const snap = snaps[i];
    const arch = snap.exists ? (snap.data() as ArchitectureDoc) : null;
    if (!arch || arch.uid !== uid) {
      return {
        runId: v.runId,
        variantId: v.variantId,
        label: v.label,
        failed: true,
        errorMessage: v.errorMessage ?? "Variant data unavailable",
        architecture: null,
      };
    }
    if (arch.status !== "complete" || !arch.architecture) {
      return {
        runId: v.runId,
        variantId: v.variantId,
        label: v.label,
        failed: arch.status === "failed",
        errorMessage: v.errorMessage ?? arch.errorMessage,
        architecture: null,
      };
    }
    // `Architecture.parse` throws on bad data; safe-parse so a single
    // malformed variant doesn't 500 the whole cockpit.
    const parsed = Architecture.safeParse(arch.architecture);
    if (!parsed.success) {
      return {
        runId: v.runId,
        variantId: v.variantId,
        label: v.label,
        failed: true,
        errorMessage: "Variant payload failed validation",
        architecture: null,
      };
    }
    return {
      runId: v.runId,
      variantId: v.variantId,
      label: v.label,
      failed: false,
      architecture: parsed.data,
    };
  });
}
