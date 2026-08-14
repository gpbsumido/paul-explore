"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Group, MeshBasicMaterial } from "three";
import { PauseWhenOffscreen } from "@/app/landing/models/PauseWhenOffscreen";
import {
  HERO_SHAPES,
  pickNextShape,
  MORPH_HOLD_S,
  MORPH_FADE_S,
} from "./heroShapes";

/** How far the object leans toward the pointer, in radians at the edge of the viewport. */
const LEAN = 0.28;
/** Fraction of the remaining distance covered each frame. A cheap critically-damped feel. */
const DAMPING = 0.06;
/** Peak wireframe opacity for the shape that currently holds the stage. */
const PEAK = 0.85;

/**
 * The geometry for one entry in HERO_SHAPES. Each is a wireframe stand-in for
 * a piece of the site: the knot for the codebase, a low-poly globe for the
 * Toronto world, a sphere for the NBA console, a thin box for the TCG card,
 * an octahedron for the v3 node graph, and a fat torus for the v4 reel.
 */
function ShapeGeometry({ id }: { id: string }) {
  switch (id) {
    case "globe":
      return <icosahedronGeometry args={[1.35, 1]} />;
    case "ball":
      return <sphereGeometry args={[1.15, 12, 8]} />;
    case "card":
      return <boxGeometry args={[1.6, 2.2, 0.08]} />;
    case "graph":
      return <octahedronGeometry args={[1.35, 0]} />;
    case "reel":
      return <torusGeometry args={[1.15, 0.42, 8, 18]} />;
    default:
      return <torusKnotGeometry args={[0.95, 0.22, 32, 4, 2, 3]} />;
  }
}

/** Hermite ease for the crossfade, so the swap never reads as a hard cut. */
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Two mesh slots crossfading inside one constant cage.
 *
 * Every MORPH_HOLD_S the idle slot takes the next shape and the two trade
 * opacity and scale over MORPH_FADE_S, so one object appears to melt into the
 * next instead of blinking. The clock accumulates inside useFrame, which means
 * PauseWhenOffscreen freezes the cycle along with everything else, and the
 * cage never fades, which is what carries the eye across the swap. Rotation
 * and opacity live on the object3D and the material, never in React state;
 * state only changes twice per cycle, when a slot takes its next shape.
 */
function MorphingShapes() {
  const group = useRef<Group>(null);
  const matA = useRef<MeshBasicMaterial>(null);
  const matB = useRef<MeshBasicMaterial>(null);
  const scaleA = useRef<Group>(null);
  const scaleB = useRef<Group>(null);
  const { pointer } = useThree();

  const [slots, setSlots] = useState({ a: 0, b: 1, activeA: true });
  const held = useRef(0);
  const fading = useRef(false);
  const progress = useRef(0);

  useFrame((_, delta) => {
    const g = group.current;
    if (g) {
      g.rotation.y += delta * 0.22;
      g.rotation.x += (pointer.y * LEAN - g.rotation.x) * DAMPING;
      g.rotation.z += (pointer.x * LEAN - g.rotation.z) * DAMPING;
    }

    const on = slots.activeA
      ? { mat: matA.current, scale: scaleA.current }
      : { mat: matB.current, scale: scaleB.current };
    const off = slots.activeA
      ? { mat: matB.current, scale: scaleB.current }
      : { mat: matA.current, scale: scaleA.current };
    if (!on.mat || !off.mat || !on.scale || !off.scale) return;

    if (!fading.current) {
      held.current += delta;
      on.mat.opacity = PEAK;
      off.mat.opacity = 0;
      on.scale.scale.setScalar(1);
      if (held.current >= MORPH_HOLD_S) {
        const current = slots.activeA ? slots.a : slots.b;
        const next = pickNextShape(current, Math.random);
        setSlots((prev) =>
          prev.activeA ? { ...prev, b: next } : { ...prev, a: next },
        );
        fading.current = true;
        progress.current = 0;
      }
      return;
    }

    progress.current += delta / MORPH_FADE_S;
    const t = smoothstep(Math.min(progress.current, 1));
    on.mat.opacity = PEAK * (1 - t);
    off.mat.opacity = PEAK * t;
    on.scale.scale.setScalar(1 - 0.3 * t);
    off.scale.scale.setScalar(0.7 + 0.3 * t);

    if (progress.current >= 1) {
      fading.current = false;
      held.current = 0;
      setSlots((prev) => ({ ...prev, activeA: !prev.activeA }));
    }
  });

  return (
    <group ref={group}>
      <group ref={scaleA}>
        <mesh>
          <ShapeGeometry id={HERO_SHAPES[slots.a].id} />
          <meshBasicMaterial
            ref={matA}
            color="#219b84"
            wireframe
            transparent
            opacity={PEAK}
          />
        </mesh>
      </group>
      <group ref={scaleB}>
        <mesh>
          <ShapeGeometry id={HERO_SHAPES[slots.b].id} />
          <meshBasicMaterial
            ref={matB}
            color="#219b84"
            wireframe
            transparent
            opacity={0}
          />
        </mesh>
      </group>
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
 * meshBasicMaterial so there is nothing to light: wireframes at low opacity
 * read as one object without a light rig or a shadow pass. PauseWhenOffscreen
 * stops the frame loop the moment the hero scrolls away, which also pauses the
 * shape cycle since its clock lives in useFrame.
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
      <MorphingShapes />
    </Canvas>
  );
}
