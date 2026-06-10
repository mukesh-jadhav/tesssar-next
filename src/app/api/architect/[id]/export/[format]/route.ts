import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/firebase/admin";
import { Architecture, type ArchitectureDoc } from "@/types/architecture";
import { slugify } from "@/lib/utils";
import { renderArchitecturePDF } from "@/lib/pdf/report";
import { renderArchitectureMarkdown } from "@/lib/exports/markdown";
import { renderArchitecturePPTX } from "@/lib/exports/pptx";
import { rateLimit, rateLimitResponse } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORMATS = ["pdf", "md", "pptx"] as const;
type Format = (typeof FORMATS)[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; format: string }> },
) {
  const { id, format: rawFormat } = await params;
  const format = rawFormat.toLowerCase();
  if (!FORMATS.includes(format as Format)) {
    return new NextResponse(`Unsupported format: ${rawFormat}`, { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // Exports allocate big in-memory buffers (PDF/PPTX). 30/min/user is
  // generous for a human and crushing for a bot loop.
  const guard = rateLimit({
    key: `export:uid:${user.uid}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!guard.ok) return rateLimitResponse(guard);

  const snap = await adminDb.collection("architectures").doc(id).get();
  if (!snap.exists) return new NextResponse("Not found", { status: 404 });
  const doc = snap.data() as ArchitectureDoc;
  if (doc.uid !== user.uid) return new NextResponse("Forbidden", { status: 403 });
  if (doc.status !== "complete" || !doc.architecture) {
    return new NextResponse("Architecture not ready", { status: 409 });
  }

  const arch = Architecture.parse(doc.architecture);
  const baseName = `tessar-${slugify(arch.meta.title)}`;

  switch (format as Format) {
    case "pdf": {
      const buffer = await renderArchitecturePDF(arch);
      return binary(new Uint8Array(buffer), `${baseName}.pdf`, "application/pdf");
    }
    case "md": {
      const text = renderArchitectureMarkdown(arch);
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${baseName}.md"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }
    case "pptx": {
      const buffer = await renderArchitecturePPTX(arch);
      return binary(
        new Uint8Array(buffer),
        `${baseName}.pptx`,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      );
    }
  }
}

function binary(body: Uint8Array, filename: string, contentType: string) {
  return new NextResponse(body as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
