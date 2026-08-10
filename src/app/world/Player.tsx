"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import type { Group, Mesh } from "three";
import { useSegments } from "./detail";
import { makeTextTexture } from "./textures";
import { SKIN_TONE, type Outfit } from "./outfits";

export type PlayerMotion = {
  phase: number;
  // 0 standing … 1 full stride.
  stride: number;
  // Height above the ground while jumping.
  air: number;
};

type PlayerProps = {
  // Outer group: world position (including jump height) + heading.
  readonly outerRef: RefObject<Group | null>;
  // Inner group: body bob and lean, so it never fights the heading.
  readonly bobRef: RefObject<Group | null>;
  // Walk cycle shared from the game loop; drives the limb swing here.
  readonly motionRef: RefObject<PlayerMotion>;
  readonly lantern: number;
  readonly outfit: Outfit;
};

/**
 * The explorer, dressed in team colors from the outfit picker: ball cap,
 * jersey with a number on the back, shorts or ball pants, and sneakers. Limbs
 * swing with the walk cycle and tuck mid-jump; the blob shadow stays on the
 * ground and shrinks with altitude. Faces +z at heading 0.
 */
export default function Player({
  outerRef,
  bobRef,
  motionRef,
  lantern,
  outfit,
}: PlayerProps) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const shadowRef = useRef<Mesh>(null);

  const round = useSegments(20);
  const fine = useSegments(28);

  const numberTexture = useMemo(
    () =>
      outfit.number
        ? makeTextTexture(outfit.number, {
            fontSize: 96,
            color: outfit.numberColor ?? "#ffffff",
          })
        : null,
    [outfit.number, outfit.numberColor],
  );
  useEffect(() => () => numberTexture?.dispose(), [numberTexture]);

  useFrame(() => {
    const motion = motionRef.current;
    if (!motion) return;
    const airborne = motion.air > 0.05;
    const swing = airborne ? 0 : Math.sin(motion.phase) * 0.65 * motion.stride;
    if (leftArmRef.current)
      leftArmRef.current.rotation.x = airborne ? -0.9 : swing;
    if (rightArmRef.current)
      rightArmRef.current.rotation.x = airborne ? -0.9 : -swing;
    if (leftLegRef.current)
      leftLegRef.current.rotation.x = airborne ? 0.55 : -swing * 0.9;
    if (rightLegRef.current)
      rightLegRef.current.rotation.x = airborne ? 0.4 : swing * 0.9;
    const shadow = shadowRef.current;
    if (shadow) {
      // The outer group carries the jump height, so pull the shadow back down
      // to street level and let it shrink and fade with altitude.
      shadow.position.y = 0.065 - motion.air;
      const shrink = Math.max(0.45, 1 - motion.air * 0.18);
      shadow.scale.set(shrink, shrink, 1);
      (shadow.material as THREE.MeshBasicMaterial).opacity =
        0.35 * Math.max(0.35, 1 - motion.air * 0.12);
    }
  });

  // The unlocked outfit is all limbs: the torso and head stay ordinary while
  // the legs and arms stretch, which lifts the whole upper body off the
  // ground. Hip height rises by exactly the extra leg length so the feet
  // still land on the pavement.
  const lanky = (outfit.height ?? 1) > 1;
  const legStretch = lanky ? 4.2 : 1;
  const armStretch = lanky ? 1.9 : 1;
  const limbSlim = lanky ? 0.72 : 1;
  const hip = 0.46;
  const lift = lanky ? 0.44 * (legStretch - 1) : 0;

  return (
    <group ref={outerRef}>
      {/* a warm lantern glow that travels with the explorer */}
      <pointLight
        position={[0, 3 + lift, 1]}
        intensity={lantern}
        distance={16}
        decay={1.8}
        color="#ffd9a0"
      />
      <group ref={bobRef}>
        {/* everything above the hips rides up as the legs get longer */}
        <group position={[0, lift, 0]}>
          {/* jersey torso */}
          <mesh position={[0, 0.72, 0]}>
            <capsuleGeometry args={[0.34, 0.42, 8, round]} />
            <meshStandardMaterial color={outfit.jersey} roughness={0.65} />
          </mesh>
          {/* hem trim */}
          <mesh position={[0, 0.46, 0]} scale={[1, 0.4, 1]}>
            <torusGeometry args={[0.33, 0.055, 10, round]} />
            <meshStandardMaterial color={outfit.jerseyTrim} roughness={0.7} />
          </mesh>
          {/* placket */}
          <mesh position={[0, 0.78, 0.345]}>
            <boxGeometry args={[0.05, 0.42, 0.02]} />
            <meshStandardMaterial color={outfit.jerseyTrim} roughness={0.55} />
          </mesh>
          {/* number on the back */}
          {numberTexture && (
            <mesh position={[0, 0.8, -0.36]} rotation={[0, Math.PI, 0.06]}>
              <planeGeometry args={[0.3, 0.36]} />
              <meshBasicMaterial map={numberTexture} transparent />
            </mesh>
          )}
          {/* arms */}
          {[
            { ref: leftArmRef, side: -1 },
            { ref: rightArmRef, side: 1 },
          ].map(({ ref, side }) => (
            <group
              key={side}
              ref={ref}
              position={[side * 0.42, 1.02, 0]}
              scale={[limbSlim, armStretch, limbSlim]}
            >
              <mesh position={[0, -0.13, 0]}>
                <capsuleGeometry args={[0.115, 0.12, 6, round]} />
                <meshStandardMaterial color={outfit.sleeve} roughness={0.65} />
              </mesh>
              <mesh position={[0, -0.32, 0]}>
                <capsuleGeometry args={[0.095, 0.16, 6, round]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.48, 0]}>
                <sphereGeometry args={[0.105, round, Math.ceil(round * 0.7)]} />
                <meshStandardMaterial color={outfit.hands} roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
        {/* legs: shorts, calves, sneakers — hung from the raised hip */}
        {[
          { ref: leftLegRef, side: -1 },
          { ref: rightLegRef, side: 1 },
        ].map(({ ref, side }) => (
          <group
            key={side}
            ref={ref}
            position={[side * 0.15, hip + lift, 0]}
            scale={[limbSlim, legStretch, limbSlim]}
          >
            <mesh position={[0, -0.1, 0]}>
              <capsuleGeometry args={[0.14, 0.1, 6, round]} />
              <meshStandardMaterial color={outfit.shorts} roughness={0.75} />
            </mesh>
            <mesh position={[0, -0.26, 0]}>
              <capsuleGeometry args={[0.105, 0.14, 6, round]} />
              <meshStandardMaterial color={outfit.calves} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.38, 0.05]} scale={[1, 0.55, 1.4]}>
              <sphereGeometry args={[0.125, round, Math.ceil(round * 0.7)]} />
              <meshStandardMaterial color={outfit.shoes} roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* head */}
        <mesh position={[0, 1.32, 0]}>
          <sphereGeometry args={[0.27, fine, Math.ceil(fine * 0.75)]} />
          <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
        </mesh>
        {/* eyes with catchlights */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.09, 1.34, 0.24]}>
              <sphereGeometry args={[0.038, 12, 10]} />
              <meshStandardMaterial color="#1b1e26" roughness={0.3} />
            </mesh>
            <mesh position={[side * 0.09 + 0.012, 1.352, 0.27]}>
              <sphereGeometry args={[0.011, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
        {/* rosy cheeks */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.16, 1.27, 0.2]}
            scale={[1, 0.7, 0.5]}
          >
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color="#f4a29a" roughness={0.9} />
          </mesh>
        ))}
        {/* ball cap: dome, front mark, brim */}
        <mesh position={[0, 1.46, -0.01]}>
          <sphereGeometry
            args={[
              0.275,
              fine,
              Math.ceil(fine * 0.6),
              0,
              Math.PI * 2,
              0,
              Math.PI * 0.52,
            ]}
          />
          <meshStandardMaterial color={outfit.cap} roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.52, 0.24]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial color={outfit.capMark} />
        </mesh>
        <mesh
          position={[0, 1.47, 0.33]}
          rotation={[-0.25, 0, 0]}
          scale={[1, 0.22, 1.15]}
        >
          <cylinderGeometry
            args={[0.19, 0.19, 0.16, round, 1, false, -Math.PI / 2, Math.PI]}
          />
          <meshStandardMaterial color={outfit.capBrim} roughness={0.7} />
        </mesh>
      </group>
      {/* soft blob shadow — cheaper than a real shadow map */}
      <mesh
        ref={shadowRef}
        position={[0, 0.065, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[lanky ? 0.55 : 0.5, 28]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
