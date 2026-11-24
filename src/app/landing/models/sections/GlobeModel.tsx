"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "@/components/ThemeProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/** Slow-rotating wireframe icosahedron used as the hero ambient background model.
 *  Fully procedural — no GLB. Oversized to bleed off all viewport edges.
 *  Rotation stops when the user prefers reduced motion. */
export function GlobeModel() {
  const ref = useRef<THREE.Mesh>(null);
  const prefersReduced = usePrefersReducedMotion();
  const { theme } = useTheme();

  useFrame((_, delta) => {
    if (prefersReduced || !ref.current) return;
    ref.current.rotation.y += delta * 0.12;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2, 4]} />
      <meshStandardMaterial
        color={theme === "dark" ? "#1a1a2e" : "#3b82f6"}
        wireframe
      />
    </mesh>
  );
}
