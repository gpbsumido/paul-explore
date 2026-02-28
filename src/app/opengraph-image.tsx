import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "paul-explore — personal playground and portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default OG image shared across all pages. Shows the site name at the top
 * and a short descriptor at the bottom. Keeps the same dark palette as the app.
 *
 * Pages that need something page-specific can drop their own opengraph-image.tsx
 * in the route folder — Next.js will pick the closest one.
 */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px 80px",
          justifyContent: "space-between",
        }}
      >
        {/* site label — top left */}
        <span
          style={{
            color: "#404040",
            fontSize: 18,
            fontFamily: "sans-serif",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          paul-explore
        </span>

        {/* main content — bottom */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span
            style={{
              color: "#fafafa",
              fontSize: 60,
              fontFamily: "sans-serif",
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            Personal playground and portfolio.
          </span>
          <span
            style={{
              color: "#6b7280",
              fontSize: 24,
              fontFamily: "sans-serif",
            }}
          >
            NBA stats · Pokémon TCG · GraphQL Pokédex · Calendar
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
