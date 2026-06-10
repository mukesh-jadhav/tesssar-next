import { ImageResponse } from "next/og";

/**
 * Apple touch icon (180×180) for iOS home-screen bookmarks and rich
 * link previews. Mirrors the favicon mark at a larger size.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 800,
          borderRadius: 40,
        }}
      >
        T
      </div>
    ),
    { ...size },
  );
}
