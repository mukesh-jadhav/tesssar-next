import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { ArchitectureRunLive } from "@/components/architecture/ArchitectureRunLive";
import { reapIfStuck } from "@/lib/agent/watchdog";
import type { ArchitectureDoc } from "@/types/architecture";

export default async function ArchitectureResultPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/architecture/" + params.id);
  const snap = await adminDb.collection("architectures").doc(params.id).get();
  if (!snap.exists) notFound();
  const raw = snap.data() as ArchitectureDoc;
  if (raw.uid !== user.uid) redirect("/dashboard");
  const initial = await reapIfStuck(raw);

  return <ArchitectureRunLive initial={initial} />;
}
