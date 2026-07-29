"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { trailStrength, TRAIL_MAX_POINTS, type TrailPoint } from "@/lib/world/trail";

type TrailProps = {
  // Newest-first ring buffer maintained by the owner's frame loop.
  readonly pointsRef: RefObject<readonly TrailPoint[]>;
  readonly color: string;
  // Scales the whole wake down (the ghost's is fainter than the player's).
  readonly intensity?: number;
};

/**
 * The glowing wake itself: one instanced disc per trail point, additive so
 * fading is just dimming the instance color toward black. Cost is a single
 * draw call regardless of length.
 */
export default function Trail({ pointsRef, color, intensity = 1 }: TrailProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const scratch = useRef({ dummy: new THREE.Object3D(), color: new THREE.Color() });

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const points = pointsRef.current ?? [];
    const { dummy, color: tint } = scratch.current;
    for (let i = 0; i < TRAIL_MAX_POINTS; i += 1) {
      const point = points[i];
      const strength = point ? trailStrength(point, clock.elapsedTime) * intensity : 0;
      if (!point || strength <= 0) {
        dummy.position.set(0, -10, 0);
        dummy.scale.setScalar(0.0001);
      } else {
        dummy.position.set(point.x, 0.065, point.z);
        dummy.rotation.x = -Math.PI / 2;
        dummy.scale.setScalar(0.5 + strength * 0.5);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      tint.copy(baseColor).multiplyScalar(strength * 0.55);
      mesh.setColorAt(i, tint);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TRAIL_MAX_POINTS]} frustumCulled={false}>
      <circleGeometry args={[0.22, 16]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
