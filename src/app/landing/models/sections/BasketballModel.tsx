"use client";

import { useMemo } from "react";
import { useGLTF, Float } from "@react-three/drei";
import HotspotDot from "../HotspotDot";

useGLTF.preload("/models/basketball.glb?v=2");

/**
 * Basketball GLB with Float idle animation and 3 hotspot dots anchored
 * to the model surface. Scale targets an "oversized" appearance so the
 * ball bleeds off the right viewport edge in the NBA bleed layout.
 *
 * Hotspot positions are hand-tuned for the left-facing hemisphere
 * (dots on the off-screen right side are naturally hidden by overflow clip).
 */
export default function BasketballModel() {
  const { scene } = useGLTF("/models/basketball.glb?v=2");
  // Clone so the cached singleton isn't mutated or shared across remounts.
  const cloned = useMemo(() => scene.clone(), [scene]);

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <group scale={2.5}>
        <primitive object={cloned} />
      </group>
      {/* Hotspots inside Float so they follow the float translation */}
      <HotspotDot
        position={[0, 1.5, 0.5]}
        label="Live Player Stats"
        description="Real-time NBA API data proxied via BFF — no credentials reach the browser."
        direction="down"
      />
      <HotspotDot
        position={[-1.3, 0.2, 0.4]}
        label="Fantasy Scoring"
        description="Bracket picks, head-to-head matchups, and a live leaderboard."
      />
      <HotspotDot
        position={[0.8, -1.0, 0.6]}
        label="Zero-latency UI"
        description="Optimistic updates with instant feedback — no loading spinners on interactions."
      />
    </Float>
  );
}
