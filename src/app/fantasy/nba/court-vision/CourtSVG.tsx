"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ShotZone } from "@/types/nba";

/** Zone color by FG%: cold (<35%), average (35-48%), hot (>48%). */
function zoneColor(pct: number): string {
  if (pct < 0.35) return "rgba(59,130,246,0.25)";
  if (pct <= 0.48) return "rgba(250,204,21,0.3)";
  return "rgba(239,68,68,0.45)";
}

const ZONE_LABEL: Record<string, string> = {
  paint: "Paint",
  "mid-left": "Mid-Range Left",
  "mid-right": "Mid-Range Right",
  "corner-3-left": "Corner 3 Left",
  "corner-3-right": "Corner 3 Right",
  "above-break-3": "Above the Break 3",
};

/**
 * SVG zone paths for a half-court with viewBox 0 0 400 375.
 * Coordinates approximate standard NBA court proportions.
 */
const ZONE_PATHS: Record<string, string> = {
  // Paint: rectangle from baseline to free-throw line
  paint: "M 150 375 L 150 235 L 250 235 L 250 375 Z",
  // Mid-range left: area left of paint, inside 3pt arc
  "mid-left": "M 60 375 L 60 310 Q 80 220 150 200 L 150 235 L 150 375 Z",
  // Mid-range right: area right of paint, inside 3pt arc
  "mid-right": "M 340 375 L 340 310 Q 320 220 250 200 L 250 235 L 250 375 Z",
  // Corner 3 left: below the arc break on left
  "corner-3-left": "M 0 375 L 0 310 L 60 310 L 60 375 Z",
  // Corner 3 right: below the arc break on right
  "corner-3-right": "M 340 375 L 340 310 L 400 310 L 400 375 Z",
  // Above the break 3: arc area above the break
  "above-break-3":
    "M 0 310 L 60 310 Q 80 220 150 200 L 150 235 L 150 200 Q 160 120 200 80 Q 240 120 250 200 L 250 235 L 250 200 Q 320 220 340 310 L 400 310 L 400 0 L 0 0 Z",
};

interface Props {
  zones: ShotZone[];
  loading?: boolean;
}

/** Basketball half-court SVG with color-coded shooting zones. */
export default function CourtSVG({ zones, loading }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const zoneMap = new Map(zones.map((z) => [z.zone, z]));

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg
        viewBox="0 0 400 375"
        className="w-full"
        role="img"
        aria-label="Basketball half-court shot chart"
      >
        {/* Background */}
        <rect width="400" height="375" fill="rgba(0,0,0,0.3)" rx="4" />

        {/* Zone overlays */}
        {Object.entries(ZONE_PATHS).map(([zone, path], i) => {
          const data = zoneMap.get(zone);
          const fill = loading
            ? "rgba(255,255,255,0.04)"
            : data
              ? zoneColor(data.fgPct)
              : "rgba(255,255,255,0.02)";

          return (
            <motion.path
              key={zone}
              d={path}
              fill={fill}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
              className={loading ? "animate-pulse" : "cursor-pointer"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: loading ? 0 : i * 0.08, duration: 0.3 }}
              onMouseEnter={() => !loading && setHovered(zone)}
              onMouseLeave={() => setHovered(null)}
              style={{
                filter: hovered === zone ? "brightness(1.3)" : "brightness(1)",
              }}
            />
          );
        })}

        {/* Court lines */}
        <g fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5">
          {/* Boundary */}
          <rect x="0" y="0" width="400" height="375" />

          {/* Paint / key */}
          <rect x="150" y="235" width="100" height="140" />

          {/* Free throw circle */}
          <circle cx="200" cy="235" r="50" />

          {/* Restricted area arc */}
          <path d="M 180 375 A 20 20 0 0 1 220 375" />

          {/* Basket */}
          <circle
            cx="200"
            cy="355"
            r="6"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
          />

          {/* 3-point arc */}
          <path d="M 60 375 L 60 310 Q 60 100 200 80 Q 340 100 340 310 L 340 375" />

          {/* Center court line / half-court arc */}
          <line x1="0" y1="0" x2="400" y2="0" />
          <path d="M 140 0 A 60 60 0 0 1 260 0" />
        </g>
      </svg>

      {/* Tooltip */}
      {hovered && zoneMap.has(hovered) && (
        <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] shadow-lg pointer-events-none">
          <span className="font-semibold text-foreground">
            {ZONE_LABEL[hovered] ?? hovered}
          </span>
          <span className="ml-2 text-muted">
            {(zoneMap.get(hovered)!.fgPct * 100).toFixed(1)}% FG |{" "}
            {zoneMap.get(hovered)!.attPerGame} att/game
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted">
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: "rgba(59,130,246,0.4)" }}
          />
          Cold (&lt;35%)
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: "rgba(250,204,21,0.5)" }}
          />
          Average
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: "rgba(239,68,68,0.6)" }}
          />
          Hot (&gt;48%)
        </div>
      </div>
    </div>
  );
}
