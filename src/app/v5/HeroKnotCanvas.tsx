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
    // Four radial segments, not forty. `wireframe` draws every triangle edge,
    // so a tube smooth enough to look round comes out as a scribble at this
    // size. A square cross-section gives large flat facets whose edges you can
    // actually follow, which is the same low-poly language the Toronto world
    // is built in. The cage is a bare icosahedron: it frames the knot without
    // competing with it for the same lines.
    <group ref={group}>
      <mesh>
        <torusKnotGeometry args={[0.95, 0.22, 32, 4, 2, 3]} />
        <meshBasicMaterial
          color="#219b84"
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[2.05, 1]} />
        <meshBasicMaterial
          color="#d97e1f"
          wireframe
          transparent
          opacity={0.22}
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
      camera={{ position: [0, 0, 5.4], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <PauseWhenOffscreen activeFrameloop="always" />
      <Knot />
    </Canvas>
  );
}
