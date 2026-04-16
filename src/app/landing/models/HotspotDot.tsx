"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";

type Props = {
  /** World-space position of the hotspot anchor. */
  position: [number, number, number];
  /** Short label shown in the tooltip heading. */
  label: string;
  /** Supporting description shown below the label. */
  description: string;
};

/**
 * R3F Html overlay that renders a pulsing dot with a glassmorphism
 * tooltip on hover. CSS lives in globals.css under the .hotspot-* classes.
 */
export default function HotspotDot({ position, label, description }: Props) {
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
          <div className="hotspot-tooltip" role="tooltip">
            <p className="hotspot-tooltip-label">{label}</p>
            <p className="hotspot-tooltip-desc">{description}</p>
          </div>
        )}
      </div>
    </Html>
  );
}
