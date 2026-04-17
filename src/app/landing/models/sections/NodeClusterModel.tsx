"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";

// ---------------------------------------------------------------------------
// GraphQL logo: regular hexagon (6 outer nodes + ring) + inner triangle
// connecting every other vertex (12 o'clock, 4 o'clock, 8 o'clock).
// No center node.
//
// Vertex indexing (starting at 6 o'clock = bottom, counterclockwise):
//   0 = 6 o'clock  (bottom)
//   1 = 4 o'clock  (lower-right)
//   2 = 2 o'clock  (upper-right)
//   3 = 12 o'clock (top)
//   4 = 10 o'clock (upper-left)
//   5 = 8 o'clock  (lower-left)
//
// Triangle vertices: 3 (top), 1 (lower-right), 5 (lower-left)
// ---------------------------------------------------------------------------

const R = 1.0; // hexagon circumradius

const HEX: [number, number, number][] = Array.from({ length: 6 }, (_, i) => {
  // Start at -PI/2 (bottom) and go counterclockwise — standard math convention.
  // In Three.js Y-up: sin gives vertical, cos gives horizontal.
  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(a) * R, Math.sin(a) * R, 0];
});

// Outer ring: 6 adjacent pairs
const RING_EDGES: [number, number][] = Array.from({ length: 6 }, (_, i) => [
  i,
  (i + 1) % 6,
]);

// Inner triangle: top (3), lower-right (1), lower-left (5)
const TRI_EDGES: [number, number][] = [
  [3, 1],
  [1, 5],
  [5, 3],
];

function EdgeTube({
  from,
  to,
  radius,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
}) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(...from),
        new THREE.Vector3(...to),
      ]),
    // from/to are stable references from the module-level HEX constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <mesh>
      <tubeGeometry args={[curve, 16, radius, 8, false]} />
      <meshStandardMaterial
        color="#e535ab"
        emissive="#c4148a"
        emissiveIntensity={0.55}
        metalness={0.2}
        roughness={0.5}
      />
    </mesh>
  );
}

function NodeSphere({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.16, 28, 28]} />
      <meshStandardMaterial
        color="#e535ab"
        emissive="#c4148a"
        emissiveIntensity={0.7}
        metalness={0.25}
        roughness={0.35}
      />
    </mesh>
  );
}

/**
 * Procedural GraphQL logo model.
 * 6 sphere nodes at hexagon vertices, connected by a hexagon ring and an
 * inner equilateral triangle that joins every other vertex (12, 4, 8 o'clock).
 * Rotates slowly around Y. No hotspot interactivity — used as a full-bleed
 * background canvas at 30% opacity.
 */
export default function NodeClusterModel() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.22;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hexagon outer ring */}
      {RING_EDGES.map(([a, b], i) => (
        <EdgeTube key={`ring-${i}`} from={HEX[a]} to={HEX[b]} radius={0.038} />
      ))}
      {/* Inner triangle (slightly thicker to read well at depth) */}
      {TRI_EDGES.map(([a, b], i) => (
        <EdgeTube key={`tri-${i}`} from={HEX[a]} to={HEX[b]} radius={0.038} />
      ))}
      {/* Nodes — rendered last so they sit on top of the tubes */}
      {HEX.map((pos, i) => (
        <NodeSphere key={`node-${i}`} position={pos} />
      ))}
    </group>
  );
}
