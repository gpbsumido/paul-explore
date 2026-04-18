"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Html } from "@react-three/drei";

type Props = {
  /** World-space position of the hotspot anchor. */
  position: [number, number, number];
  /** Short label shown in the tooltip heading. */
  label: string;
  /** Supporting description shown below the label. */
  description: string;
  /** Which side of the dot the tooltip opens toward. Defaults to "up". */
  direction?: "up" | "down";
};

const CLAMP_MARGIN = 8;

/**
 * Tooltip content. Extracted so useLayoutEffect([], []) fires on mount
 * rather than on a parent state toggle — the <Html> container is always
 * mounted in HotspotDot, so Drei has already positioned it before this
 * component appears, making getBoundingClientRect() reliable.
 */
function TooltipContent({
  label,
  description,
  direction,
}: {
  label: string;
  description: string;
  direction: "up" | "down";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translateX(-50%)";
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (rect.left < CLAMP_MARGIN) {
      el.style.transform = `translateX(calc(-50% + ${CLAMP_MARGIN - rect.left}px))`;
    } else if (rect.right > vw - CLAMP_MARGIN) {
      el.style.transform = `translateX(calc(-50% - ${rect.right - (vw - CLAMP_MARGIN)}px))`;
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`hotspot-tooltip hotspot-tooltip--${direction}`}
      role="tooltip"
    >
      <p className="hotspot-tooltip-label">{label}</p>
      <p className="hotspot-tooltip-desc">{description}</p>
    </div>
  );
}

/**
 * R3F Html overlay that renders a pulsing dot with a glassmorphism
 * tooltip on hover. CSS lives in globals.css under the .hotspot-* classes.
 *
 * The <Html> wrapper is always mounted so Drei positions its container before
 * TooltipContent appears — this makes the viewport-clamping measurement
 * in TooltipContent's useLayoutEffect reliable.
 */
export default function HotspotDot({
  position,
  label,
  description,
  direction = "up",
}: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <Html position={position} center occlude>
      <div className="hotspot-root">
        <span className="hotspot-ring" aria-hidden="true" />
        <button
          className="hotspot-dot"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          aria-label={label}
        />
        {hovered && (
          <TooltipContent
            label={label}
            description={description}
            direction={direction}
          />
        )}
      </div>
    </Html>
  );
}
