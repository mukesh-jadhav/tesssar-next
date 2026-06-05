import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { ArchitectureView } from "@/components/architecture/ArchitectureView";
import { Architecture, type ArchitectureDoc } from "@/types/architecture";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      <div className="container max-w-2xl py-12">
        <Card className="border-destructive/30">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <span className="font-medium">Generation failed</span>
            </div>
            <p className="text-sm text-muted-foreground">{doc.errorMessage ?? "Unknown error"}</p>
            <p className="text-xs text-muted-foreground">Your credit has been refunded.</p>
            <Button asChild><Link href="/new">Try again</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (doc.status !== "complete" || !doc.architecture) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardContent className="p-6">
            <div className="font-medium">Still generating…</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Refresh in a moment, or go back to <Link href="/new" className="underline">start a new run</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const arch = Architecture.parse(doc.architecture);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-8 lg:px-12">
      <ArchitectureView arch={arch} architectureId={doc.id} />
    </div>
  );
}
