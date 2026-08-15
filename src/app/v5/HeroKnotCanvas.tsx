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
  mulberry32,
  particleProgress,
} from "./heroParticles";

/** What the wrapper div reports about the pointer, mutated per event. */
export type HeroInteraction = {
  hovering: boolean;
  /** Pointer position across the wrapper, both axes in [-1, 1]. */
  x: number;
  y: number;
};

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
 * exactly one thing: the pointer pushes nearby particles aside like a magnet
 * over iron filings, each one springing back as the cursor moves off. The
 * cycle itself never reacts to the pointer. Positions live in the buffer
 * attribute and all progress lives in refs; React state is never touched, and
 * the clock accumulates in useFrame so the show pauses offscreen.
 */
/**
 * Scene colours per theme. WebGL cannot read CSS light-dark(), so the theme
 * arrives as a prop: the pale pair that glows on near-black washes out on
 * paper, where the same hues need to run darker, denser and a touch larger.
 */
const SCENE_COLORS = {
  dark: { sand: "#219b84", sandOpacity: 0.9, sandSize: 0.035, cage: "#d97e1f", cageOpacity: 0.22 },
  light: { sand: "#136357", sandOpacity: 0.95, sandSize: 0.042, cage: "#9d4b13", cageOpacity: 0.34 },
} as const;

function SandShapes({
  interaction,
  dark,
}: {
  interaction: RefObject<HeroInteraction>;
  dark: boolean;
}) {
  const group = useRef<Group>(null);
  const attribute = useRef<BufferAttribute>(null);

  const clouds = useMemo(
    () => HERO_SHAPES.map((shape) => buildShapePoints(shape.id)),
    [],
  );
  // Seeded, not Math.random: render must stay pure, and a deterministic
  // stagger means the same particle leads the charge on every visit, which
  // makes the motion tunable instead of a dice roll.
  const stagger = useMemo(() => {
    const rand = mulberry32(1013);
    return Float32Array.from({ length: PARTICLE_COUNT }, rand);
  }, []);
  const swirl = useMemo(() => {
    const rand = mulberry32(2027);
    const out = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < out.length; i++) {
      out[i] = (rand() * 2 - 1) * SWIRL;
    }
    return out;
  }, []);
  const repelRef = useRef<Float32Array | null>(null);
  const initial = useMemo(() => clouds[0].slice(), [clouds]);
  const pointerLocal = useMemo(() => new Vector3(), []);
  const groupInverse = useMemo(() => new Matrix4(), []);

  const from = useRef(0);
  const to = useRef(0);
  const held = useRef(0);
  const morphT = useRef(1);
  const repelActive = useRef(false);
  const palette = dark ? SCENE_COLORS.dark : SCENE_COLORS.light;

  useFrame((_, delta) => {
    const pointer = interaction.current;
    const g = group.current;
    if (g) {
      g.rotation.y += delta * 0.22;
    }

    const attr = attribute.current;
    if (!attr || !g) return;
    if (!repelRef.current) {
      repelRef.current = new Float32Array(PARTICLE_COUNT * 3);
    }
    const repel = repelRef.current;

    const resting = morphT.current >= 1;
    if (resting) {
      held.current += delta;
      if (held.current >= MORPH_HOLD_S) {
        held.current = 0;
        from.current = to.current;
        to.current = pickNextShape(from.current, Math.random);
        morphT.current = 0;
      }
    }

    if (morphT.current < 1) {
      morphT.current = Math.min(morphT.current + delta / MORPH_S, 1);
    }

    // The page idles far more than it morphs. When nothing is in flight and
    // the filings have settled, skip the particle pass and the buffer upload
    // entirely; a busy per-frame loop here is exactly the main-thread load
    // that showed up as input latency on the header menu.
    if (pointer.hovering) repelActive.current = true;
    if (morphT.current >= 1 && !pointer.hovering && !repelActive.current) {
      return;
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
    let maxOffset = 0;

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
      maxOffset = Math.max(
        maxOffset,
        Math.abs(repel[j]),
        Math.abs(repel[j + 1]),
        Math.abs(repel[j + 2]),
      );

      positions[j] = bx + repel[j];
      positions[j + 1] = by + repel[j + 1];
      positions[j + 2] = bz + repel[j + 2];
    }
    attr.needsUpdate = true;

    if (!pointer.hovering && maxOffset < 0.002) {
      repelActive.current = false;
    }
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
          color={palette.sand}
          size={palette.sandSize}
          sizeAttenuation
          transparent
          opacity={palette.sandOpacity}
          depthWrite={false}
        />
      </points>
      <mesh>
        <icosahedronGeometry args={[2.05, 1]} />
        <meshBasicMaterial
          color={palette.cage}
          wireframe
          transparent
          opacity={palette.cageOpacity}
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
  dark,
}: {
  interaction: RefObject<HeroInteraction>;
  dark: boolean;
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
      <SandShapes interaction={interaction} dark={dark} />
    </Canvas>
  );
}
