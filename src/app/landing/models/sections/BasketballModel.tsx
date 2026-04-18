"use client";

import { useMemo, useEffect, useState } from "react";
import { useGLTF, Float } from "@react-three/drei";
import HotspotDot from "../HotspotDot";

useGLTF.preload("/models/basketball.glb?v=2");

const getPrefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const getIsMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 767px)").matches;

/**
 * Basketball GLB with Float idle animation and 3 hotspot dots anchored
 * to the model surface. Scale targets an "oversized" appearance so the
 * ball bleeds off the right viewport edge in the NBA bleed layout.
 *
 * Float and hotspot animation are disabled when the user prefers reduced
 * motion or is on a mobile-width viewport.
 */
export default function BasketballModel() {
  const { scene } = useGLTF("/models/basketball.glb?v=2");
  const cloned = useMemo(() => scene.clone(), [scene]);

  const [prefersReduced, setPrefersReduced] = useState(getPrefersReduced);
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const onMotion = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    const onMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mqMotion.addEventListener("change", onMotion);
    mqMobile.addEventListener("change", onMobile);
    return () => {
      mqMotion.removeEventListener("change", onMotion);
      mqMobile.removeEventListener("change", onMobile);
    };
  }, []);

  const disableFloat = prefersReduced || isMobile;

  const content = (
    <>
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
    </>
  );

  if (disableFloat) return content;

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      {content}
    </Float>
  );
}
