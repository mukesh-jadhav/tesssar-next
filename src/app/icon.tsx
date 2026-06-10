import { ImageResponse } from "next/og";

/**
 * Generated favicon — an accent square with a paper "T". Replaces the
 * default Next.js favicon so search results and browser tabs carry the
 * brand mark. Kept tiny and asset-free via next/og.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E94F20",
          color: "#F6F2E9",
          fontSize: 24,
          fontWeight: 800,
          borderRadius: 7,
        }}
      >
        T
      </div>
    ),
    { ...size },
  );
}
