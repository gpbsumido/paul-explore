"use client";

import { useRef, useMemo } from "react";
import { useGLTF, Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import HotspotDot from "../HotspotDot";

useGLTF.preload("/models/lock.glb?v=2");

/**
 * Padlock GLB with a pendulum idle animation (±26° Y-axis oscillation via
 * useFrame) and gentle vertical float (no additional rotation from Float).
 * Three hotspot dots sit on the shackle and body.
 *
 * The pendulum wraps Float so the hotspots follow both the oscillation and
 * the vertical float translation.
 */
export default function LockModel() {
  const { scene } = useGLTF("/models/lock.glb?v=2");
  // Clone so the cached singleton isn't mutated or shared across remounts.
  const cloned = useMemo(() => scene.clone(), [scene]);
  const pendulumRef = useRef<Group>(null);

  useFrame((state) => {
    if (!pendulumRef.current) return;
    pendulumRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.35) * 0.45;
  });

  return (
    <group ref={pendulumRef}>
      <Float speed={0.8} rotationIntensity={0} floatIntensity={0.35}>
        {/* rotation-y 90° shows the wider Z face; y offset centers the
            padlock vertically (bounding box spans Y -0.33 to +0.22). */}
        <group
          scale={2.2}
          rotation={[0, Math.PI / 2, 0]}
          position={[0, 0.05, 0]}
        >
          <primitive object={cloned} />
        </group>
        {/* Hotspots hand-tuned to actual lock geometry (scale 2.2, rotation Y+90°).
            World-space bounds: X[-0.43,0.39] Y[-0.67,0.53] Z[-0.06,0.11] */}
        <HotspotDot
          position={[0, 0.45, 0.2]}
          label="BFF Pattern"
          description="Auth0 tokens never reach the browser — authenticated requests proxy through the server."
          direction="down"
        />
        <HotspotDot
          position={[0.28, -0.15, 0.2]}
          label="Rate Limiting"
          description="Per-endpoint request caps enforced at the middleware layer before handlers run."
        />
        <HotspotDot
          position={[-0.15, -0.52, 0.2]}
          label="CSP Headers"
          description="Strict Content-Security-Policy applied at the edge prevents XSS at the header level."
        />
      </Float>
    </group>
  );
}
