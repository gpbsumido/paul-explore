"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Slow-rotating wireframe icosahedron used as the hero ambient background model.
 *  Fully procedural — no GLB. Oversized to bleed off all viewport edges. */
export function GlobeModel() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2, 4]} />
      <meshStandardMaterial color="#1a1a2e" wireframe />
    </mesh>
  );
}
