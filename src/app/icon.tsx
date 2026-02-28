import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser tab favicon — a dark tile with a white "P".
 * Next.js serves this at /icon and injects the <link rel="icon"> tag automatically.
 * The existing favicon.ico stays as a fallback for older browsers.
 */
export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <span
          style={{
            color: "#fafafa",
            fontSize: 20,
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
