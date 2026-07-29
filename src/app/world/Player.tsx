"use client";

import type { RefObject } from "react";
import type { Group } from "three";

type PlayerProps = {
  // Outer group: world position + heading, driven by WorldScene every frame.
  readonly outerRef: RefObject<Group | null>;
  // Inner group: walk-cycle bob and lean, so it never fights the heading.
  readonly bobRef: RefObject<Group | null>;
};

/**
 * The explorer — a small stylized figure built from primitives: rounded sky
 * blue parka, cream face with two dark eyes, a toque with a pompom, and a tiny
 * backpack. Faces +z at heading 0, matching the movement math.
 */
export default function Player({ outerRef, bobRef }: PlayerProps) {
  return (
    <group ref={outerRef}>
      {/* a warm lantern glow that travels with the explorer */}
      <pointLight position={[0, 3, 1]} intensity={14} distance={16} decay={1.8} color="#ffd9a0" />
      <group ref={bobRef}>
        {/* body */}
        <mesh position={[0, 0.62, 0]} castShadow={false}>
          <capsuleGeometry args={[0.34, 0.45, 6, 14]} />
          <meshStandardMaterial color="#3aa7e8" roughness={0.6} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.28, 0]}>
          <sphereGeometry args={[0.27, 20, 16]} />
          <meshStandardMaterial color="#ffdfc2" roughness={0.7} />
        </mesh>
        {/* toque */}
        <mesh position={[0, 1.45, -0.02]}>
          <sphereGeometry args={[0.27, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#e5484d" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.66, -0.02]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
        </mesh>
        {/* eyes, on the +z face */}
        <mesh position={[-0.09, 1.3, 0.24]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#1b1e26" roughness={0.4} />
        </mesh>
        <mesh position={[0.09, 1.3, 0.24]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#1b1e26" roughness={0.4} />
        </mesh>
        {/* backpack, on the -z face */}
        <mesh position={[0, 0.78, -0.34]}>
          <boxGeometry args={[0.34, 0.42, 0.2]} />
          <meshStandardMaterial color="#f0a832" roughness={0.8} />
        </mesh>
      </group>
      {/* soft blob shadow — cheaper than a real shadow map */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
