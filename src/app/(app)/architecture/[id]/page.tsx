import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { ArchitectureRunLive } from "@/components/architecture/ArchitectureRunLive";
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
  const initial = snap.data() as ArchitectureDoc;
  if (initial.uid !== user.uid) redirect("/dashboard");

  return <ArchitectureRunLive initial={initial} />;
}
