import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon used by Safari on iOS for bookmarks and home screen.
 * Next.js serves this at /apple-icon and injects the <link rel="apple-touch-icon"> tag.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
        }}
      >
        <span
          style={{
            color: "#fafafa",
            fontSize: 110,
            fontFamily: "sans-serif",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          P
        </span>
      </div>
    ),
    { ...size },
  );
}
