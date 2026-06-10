import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { ArchitectureRunLive } from "@/components/architecture/ArchitectureRunLive";
import { reapIfStuck } from "@/lib/agent/watchdog";
import type { ArchitectureDoc } from "@/types/architecture";

export default async function ArchitectureResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/architecture/" + id);
  const snap = await adminDb.collection("architectures").doc(id).get();
  if (!snap.exists) notFound();
  const raw = snap.data() as ArchitectureDoc;
  if (raw.uid !== user.uid) redirect("/dashboard");
  const initial = await reapIfStuck(raw);

  return <ArchitectureRunLive initial={initial} />;
}
