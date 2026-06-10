import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo/site";

/**
 * Dynamic 1200×630 Open Graph / social share card. Editorial layout on
 * Tessar's warm "paper" background: small wordmark, an oversized ink
 * headline, an accent rule, and a benefit subline. No bundled font or
 * image assets — keeps the route self-contained and cache-friendly.
 */
export const alt = "Tessar — AI Cloud Architect";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F6F2E9";
const INK = "#14161A";
const INK2 = "#3A3D44";
const ACCENT = "#E94F20";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: "72px 80px",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            Tessar
          </div>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 10,
              background: ACCENT,
            }}
          />
          <div
            style={{
              marginLeft: 8,
              fontSize: 18,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: INK2,
            }}
          >
            AI Cloud Architect
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              color: INK,
              maxWidth: 980,
            }}
          >
            Cloud architecture, designed in minutes.
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ width: 220, height: 8, background: ACCENT, borderRadius: 8 }} />
          </div>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 30,
            lineHeight: 1.4,
            color: INK2,
            maxWidth: 1000,
          }}
        >
          Brief in → a 14-section, schema-validated architecture out:
          diagrams, monthly cost in ₹, scored risks, and a roadmap. First
          design free.
        </div>
      </div>
    ),
    { ...size },
  );
}
