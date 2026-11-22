"use client";

import { useId, useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";
import { blobPath } from "./blobPath";

/** Viewbox the blobs are drawn in. Square keeps the maths simple. */
const SIZE = 200;

export type BlobBackgroundProps = {
  /** One blob per seed. Two or three reads as depth; more reads as soup. */
  seeds?: number[];
  /** Fill colours, cycled across the seeds. Token vars belong here. */
  colors?: string[];
  /** How far the layers drift apart on scroll, in pixels. */
  parallax?: number;
  className?: string;
};

const DEFAULT_COLORS = [
  "var(--color-primary-400)",
  "var(--color-secondary-400)",
  "var(--color-primary-600)",
];

/**
 * Layered organic shapes behind a section, drifting at different rates as the
 * page scrolls.
 *
 * SVG rather than canvas, so it renders in jsdom, costs no context, and scales
 * without going soft. Shapes come from a seeded generator, so the server and
 * the client draw the same thing and hydration stays quiet.
 */
export default function BlobBackground({
  seeds = [1, 2],
  colors = DEFAULT_COLORS,
  parallax = 40,
  className,
}: BlobBackgroundProps) {
  const reducedMotion = useHubReducedMotion();
  // Gradient ids live in the whole page, so two backgrounds (a grid of cards)
  // must not both call theirs "blob-grad-3". useId is the same on the server
  // and the client; the colons are stripped so the id is safe inside url(#...).
  const gradientIdPrefix = `blob-grad-${useId().replace(/:/g, "")}`;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [0, -parallax]);
  const driftSlow = useTransform(scrollYProgress, [0, 1], [0, parallax * 0.5]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {seeds.map((seed, index) => (
        <m.svg
          // The index, not the seed: two layers can share a seed, and the list
          // never reorders, so the position is the stable identity.
          key={index}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          style={{
            y: reducedMotion ? 0 : index % 2 === 0 ? drift : driftSlow,
            opacity: 0.35 - index * 0.08,
          }}
        >
          <defs>
            <radialGradient id={`${gradientIdPrefix}-${index}`}>
              <stop
                offset="0%"
                stopColor={colors[index % colors.length]}
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor={colors[index % colors.length]}
                stopOpacity="0.1"
              />
            </radialGradient>
          </defs>
          <path
            className={reducedMotion ? undefined : "blob-drift"}
            style={
              reducedMotion
                ? undefined
                : {
                    animationDuration: `${22 + index * 7}s`,
                    animationDelay: `${-9 * index}s`,
                  }
            }
            d={blobPath({
              seed,
              points: 8 + index * 2,
              variance: 0.45,
              size: SIZE,
            })}
            fill={`url(#${gradientIdPrefix}-${index})`}
          />
        </m.svg>
      ))}
    </div>
  );
}
