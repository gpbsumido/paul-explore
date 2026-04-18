"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "@/components/ThemeProvider";

const getPrefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Slow-rotating wireframe icosahedron used as the hero ambient background model.
 *  Fully procedural — no GLB. Oversized to bleed off all viewport edges.
 *  Rotation stops when the user prefers reduced motion. */
export function GlobeModel() {
  const ref = useRef<THREE.Mesh>(null);
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReduced);
  const { theme } = useTheme();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
