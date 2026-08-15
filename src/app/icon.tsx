import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser tab icon — a dark tile with a light "P".
 * Next.js serves this at /icon and injects the <link rel="icon"> tag itself.
 * favicon.ico next door carries the same mark at 16 and 32, because browsers
 * ask for /favicon.ico on their own whatever the link tag says. That file was
 * create-next-app's Vercel triangle until this change, so deployed tabs wore
 * someone else's logo while this route sat unused.
 */
export default function Icon() {
  return new ImageResponse(
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
    </div>,
    { ...size },
  );
}
