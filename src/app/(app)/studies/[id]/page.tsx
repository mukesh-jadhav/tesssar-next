import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { reapStudyIfStuck } from "@/lib/agent/studies";
import type { StudyDoc } from "@/types/study";
import { StudyLive } from "@/components/studies/StudyLive";

export default async function StudyResultPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/studies/${params.id}`);

  const snap = await adminDb.collection("studies").doc(params.id).get();
  if (!snap.exists) notFound();
  const raw = snap.data() as StudyDoc;
  if (raw.uid !== user.uid) redirect("/dashboard");

  const initial = await reapStudyIfStuck(raw);

  return <StudyLive initial={initial} />;
}
