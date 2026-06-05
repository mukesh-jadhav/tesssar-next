import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { renderArchitecturePDF } from "@/lib/pdf/report";
import { Architecture, type ArchitectureDoc } from "@/types/architecture";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const snap = await adminDb.collection("architectures").doc(params.id).get();
  if (!snap.exists) return new NextResponse("Not found", { status: 404 });
  const doc = snap.data() as ArchitectureDoc;
  if (doc.uid !== user.uid) return new NextResponse("Forbidden", { status: 403 });
  if (doc.status !== "complete" || !doc.architecture) {
    return new NextResponse("Architecture not ready", { status: 409 });
  }

  const validated = Architecture.parse(doc.architecture);
  const buffer = await renderArchitecturePDF(validated);
  const filename = `tessar-${slugify(validated.meta.title)}.pdf`;

  // Convert Node Buffer to Uint8Array so it satisfies BodyInit in the edge/runtime types.
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
