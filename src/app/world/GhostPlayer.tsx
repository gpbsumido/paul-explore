"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ghostPoseAt, type GhostPath } from "@/lib/world/ghost";
import { pushTrailPoint, type TrailPoint } from "@/lib/world/trail";
import { useSegments } from "./detail";
import { makeTextTexture } from "./textures";
import Trail from "./Trail";

const SPECTRE = "#9fd8ff";

type GhostPlayerProps = {
  readonly path: GhostPath;
};

/**
 * A translucent echo of a previous stroll — same silhouette as the explorer,
 * no face, no shadow, drifting through its recorded route on a loop and
 * slipping away between laps. Purely decorative; hidden under reduced motion
 * by the scene.
 */
export default function GhostPlayer({ path }: GhostPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const round = useSegments(20);

  // The page stamps every path with a curated name (the recording visit's own,
  // or a random pick for the tour), so the bare fallback never really shows.
  const label = useMemo(
    () =>
      makeTextTexture(path.name ? `ghost of ${path.name}` : "ghost", {
        fontSize: 40,
        color: "rgba(190, 225, 255, 0.9)",
        background: "rgba(10, 13, 20, 0.55)",
        padding: 26,
      }),
    [path.name],
  );
  useEffect(() => () => label.dispose(), [label]);
  const trailRef = useRef<readonly TrailPoint[]>([]);
  const labelAspect = label.image.width / label.image.height;

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SPECTRE,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const pose = ghostPoseAt(path.points, clock.elapsedTime);
    if (!pose) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.position.set(
      pose.x,
      Math.sin(clock.elapsedTime * 1.7) * 0.06 + 0.05,
      pose.z,
    );
    group.rotation.y = pose.heading;
    trailRef.current = pushTrailPoint(trailRef.current, {
      x: pose.x,
      z: pose.z,
      t: clock.elapsedTime,
    });
  });

  return (
    <>
      <Trail pointsRef={trailRef} color={SPECTRE} intensity={0.45} />
      <group ref={groupRef} visible={false}>
        <mesh position={[0, 0.72, 0]} material={material}>
          <capsuleGeometry args={[0.34, 0.42, 8, round]} />
        </mesh>
        <mesh position={[0, 1.32, 0]} material={material}>
          <sphereGeometry args={[0.27, round, Math.ceil(round * 0.75)]} />
        </mesh>
        <mesh position={[0, 1.46, -0.01]} material={material}>
          <sphereGeometry
            args={[
              0.275,
              round,
              Math.ceil(round * 0.6),
              0,
              Math.PI * 2,
              0,
              Math.PI * 0.52,
            ]}
          />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.42, 0.85, 0]}
            material={material}
          >
            <capsuleGeometry args={[0.1, 0.3, 6, round]} />
          </mesh>
        ))}
        <sprite position={[0, 2.1, 0]} scale={[labelAspect * 0.5, 0.5, 1]}>
          <spriteMaterial
            map={label}
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </sprite>
      </group>
    </>
  );
}
