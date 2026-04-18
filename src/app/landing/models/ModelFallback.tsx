"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

/**
 * Pulsing sphere shown via Suspense while a section model loads.
 * Color matches the NBA feature accent (warm yellow).
 */
export default function ModelFallback() {
  const meshRef = useRef<Mesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    elapsed.current += delta;
    meshRef.current.rotation.y += delta * 0.4;
    meshRef.current.scale.setScalar(1 + Math.sin(elapsed.current * 2.5) * 0.04);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color="#fde68a"
        emissive="#f59e0b"
        emissiveIntensity={0.25}
        roughness={0.5}
        metalness={0.2}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}
