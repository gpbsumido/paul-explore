"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import { PauseWhenOffscreen } from "@/app/landing/models/PauseWhenOffscreen";

/** How far the knot leans toward the pointer, in radians at the edge of the viewport. */
const LEAN = 0.28;
/** Fraction of the remaining distance covered each frame. A cheap critically-damped feel. */
const DAMPING = 0.06;

/**
 * The knot itself. Rotation lives on the object3D and never in React state, so
 * the pointer lean costs no re-render, which is the same reason MagneticButton
 * uses motion values instead of state.
 */
function Knot() {
  const group = useRef<Group>(null);
  const { pointer } = useThree();

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * 0.22;
    g.rotation.x += (pointer.y * LEAN - g.rotation.x) * DAMPING;
    g.rotation.z += (pointer.x * LEAN - g.rotation.z) * DAMPING;
  });

  return (
    <group ref={group}>
      <mesh>
        <torusKnotGeometry args={[1, 0.32, 160, 24, 2, 3]} />
        <meshBasicMaterial color="#219b84" wireframe transparent opacity={0.7} />
      </mesh>
      <mesh scale={1.28}>
        <torusKnotGeometry args={[1, 0.28, 90, 12, 2, 3]} />
        <meshBasicMaterial
          color="#e69a42"
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>
    </group>
  );
}

/**
 * Ambient canvas for the hero object.
 *
 * alpha so the page background and the blob layers behind it show through, and
 * meshBasicMaterial so there is nothing to light: two wireframes at low opacity
 * read as one object without a light rig or a shadow pass. PauseWhenOffscreen
 * stops the frame loop the moment the hero scrolls away.
 */
export default function HeroKnotCanvas() {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <PauseWhenOffscreen activeFrameloop="always" />
      <Knot />
    </Canvas>
  );
}
