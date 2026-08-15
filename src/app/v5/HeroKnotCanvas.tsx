"use client";

import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Matrix4, Vector3 } from "three";
import type { Group, BufferAttribute } from "three";
import { PauseWhenOffscreen } from "@/app/landing/models/PauseWhenOffscreen";
import { HERO_SHAPES, pickNextShape, MORPH_HOLD_S } from "./heroShapes";
import {
  PARTICLE_COUNT,
  buildShapePoints,
  particleProgress,
} from "./heroParticles";

/** What the wrapper div reports about the pointer, mutated per event. */
export type HeroInteraction = {
  hovering: boolean;
  /** Pointer position across the wrapper, both axes in [-1, 1]. */
  x: number;
  y: number;
  /** Bumped on every pointer enter; the scene consumes them as morph triggers. */
  morphRequests: number;
};

/** How far the cloud leans toward the pointer, in radians at the edge. */
const LEAN = 0.28;
/** Fraction of the remaining distance covered each frame. A cheap critically-damped feel. */
const DAMPING = 0.06;
/** Seconds the sand takes to rearrange into the next shape. */
const MORPH_S = 1.4;
/** How far a particle bows away from its straight line mid-flight. */
const SWIRL = 0.55;
/** Radius of the pointer's push, in scene units. */
const REPEL_RADIUS = 1.0;
/** How hard the pointer pushes a particle sitting right on it. */
const REPEL_STRENGTH = 0.7;
/** Where the pointer sits in world space: the z=0 plane under a 45deg camera at 5.4. */
const POINTER_PLANE = Math.tan((45 / 2) * (Math.PI / 180)) * 5.4;

/**
 * The hero object as sand: one cloud of particles sampled along each shape's
 * wireframe edges, rearranging into the next shape every few seconds.
 *
 * Each particle owns a stagger offset and a random swirl vector, both fixed at
 * mount. During a morph, particle i flies from its slot on the old shape to
 * slot i on the new one along a bowed path, leaving in waves and landing
 * together, which is what reads as sand rather than a crossfade. Hover does
 * two things: entering asks for the next shape early, and the pointer itself
 * pushes nearby particles aside like a magnet over iron filings, each one
 * springing back as the cursor moves off. Positions live in the buffer
 * attribute and all progress lives in refs; React state is never touched, and
 * the clock accumulates in useFrame so the show pauses offscreen.
 */
function SandShapes({
  interaction,
}: {
  interaction: RefObject<HeroInteraction>;
}) {
  const group = useRef<Group>(null);
  const attribute = useRef<BufferAttribute>(null);

  const clouds = useMemo(
    () => HERO_SHAPES.map((shape) => buildShapePoints(shape.id)),
    [],
  );
  const stagger = useMemo(
    () => Float32Array.from({ length: PARTICLE_COUNT }, () => Math.random()),
    [],
  );
  const swirl = useMemo(() => {
    const out = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < out.length; i++) {
      out[i] = (Math.random() * 2 - 1) * SWIRL;
    }
    return out;
  }, []);
  const repel = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const initial = useMemo(() => clouds[0].slice(), [clouds]);
  const pointerLocal = useMemo(() => new Vector3(), []);
  const groupInverse = useMemo(() => new Matrix4(), []);

  const from = useRef(0);
  const to = useRef(0);
  const held = useRef(0);
  const morphT = useRef(1);
  const consumed = useRef(0);

  useFrame((_, delta) => {
    const pointer = interaction.current;
    const g = group.current;
    if (g) {
      g.rotation.y += delta * 0.22;
      const leanX = pointer.hovering ? pointer.y * LEAN : 0;
      const leanZ = pointer.hovering ? pointer.x * LEAN : 0;
      g.rotation.x += (leanX - g.rotation.x) * DAMPING;
      g.rotation.z += (leanZ - g.rotation.z) * DAMPING;
    }

    const attr = attribute.current;
    if (!attr || !g) return;

    const resting = morphT.current >= 1;
    if (resting) {
      held.current += delta;
      const asked = pointer.morphRequests > consumed.current;
      consumed.current = pointer.morphRequests;
      if (held.current >= MORPH_HOLD_S || asked) {
        held.current = 0;
        from.current = to.current;
        to.current = pickNextShape(from.current, Math.random);
        morphT.current = 0;
      }
    }

    if (morphT.current < 1) {
      morphT.current = Math.min(morphT.current + delta / MORPH_S, 1);
    }

    // The pointer lives on the z=0 world plane; the cloud lives in a rotating
    // group. One transform per frame moves the pointer into cloud space so
    // the per-particle distance check is a plain subtraction.
    pointerLocal
      .set(pointer.x * POINTER_PLANE, pointer.y * POINTER_PLANE, 0)
      .applyMatrix4(groupInverse.copy(g.matrixWorld).invert());

    const t = morphT.current;
    const a = clouds[from.current];
    const b = clouds[to.current];
    const positions = attr.array as Float32Array;
    const settle = resting ? 0.1 : 0.16;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleProgress(t, stagger[i]);
      const arc = Math.sin(Math.PI * p);
      const j = i * 3;

      const bx = a[j] + (b[j] - a[j]) * p + swirl[j] * arc;
      const by = a[j + 1] + (b[j + 1] - a[j + 1]) * p + swirl[j + 1] * arc;
      const bz = a[j + 2] + (b[j + 2] - a[j + 2]) * p + swirl[j + 2] * arc;

      let tx = 0;
      let ty = 0;
      let tz = 0;
      if (pointer.hovering) {
        const dx = bx - pointerLocal.x;
        const dy = by - pointerLocal.y;
        const dz = bz - pointerLocal.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist < REPEL_RADIUS && dist > 1e-4) {
          const push =
            ((1 - dist / REPEL_RADIUS) ** 2 * REPEL_STRENGTH) / dist;
          tx = dx * push;
          ty = dy * push;
          tz = dz * push;
        }
      }
      repel[j] += (tx - repel[j]) * settle;
      repel[j + 1] += (ty - repel[j + 1]) * settle;
      repel[j + 2] += (tz - repel[j + 2]) * settle;

      positions[j] = bx + repel[j];
      positions[j + 1] = by + repel[j + 1];
      positions[j + 2] = bz + repel[j + 2];
    }
    attr.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={attribute}
            attach="attributes-position"
            args={[initial, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#219b84"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </points>
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
 * unlit point/basic materials so there is nothing to light. Pointer state
 * arrives from the wrapper div by ref, because this canvas is pointer-events
 * none so the page underneath keeps scrolling. PauseWhenOffscreen stops the
 * frame loop the moment the hero scrolls away, which also pauses the sand
 * cycle since its clock lives in useFrame.
 */
export default function HeroKnotCanvas({
  interaction,
}: {
  interaction: RefObject<HeroInteraction>;
}) {
  return (
    <Canvas
      frameloop="always"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.4], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <PauseWhenOffscreen activeFrameloop="always" />
      <SandShapes interaction={interaction} />
    </Canvas>
  );
}
