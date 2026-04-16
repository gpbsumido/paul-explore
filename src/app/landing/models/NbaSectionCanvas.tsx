"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import SectionModelScene from "./SectionModelScene";

/** Basketball-orange rotating sphere used as a placeholder until a real model is wired up. */
function NbaPlaceholderMesh() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={meshRef} rotation={[0.15, 0, 0]}>
      <sphereGeometry args={[1.2, 48, 48]} />
      <meshStandardMaterial color="#e06020" roughness={0.55} metalness={0.1} />
    </mesh>
  );
}

/** NBA section canvas: rotating basketball placeholder. */
export default function NbaSectionCanvas() {
  return (
    <SectionModelScene>
      <NbaPlaceholderMesh />
    </SectionModelScene>
  );
}
