"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useGLTF, Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, Object3D } from "three";
import HotspotDot from "../HotspotDot";

useGLTF.preload("/models/speedometer.glb?v=3");

const NEEDLE_REST = -1.1;
const NEEDLE_GOOD = 0.65;

const NEEDLE_KEYWORDS = [
  "needle",
  "pointer",
  "hand",
  "indicator",
  "arrow",
  "aiguille",
  "zeiger",
  "arm",
];

const TARGET_SIZE = 2.2;

const getIsMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 767px)").matches;

type Props = {
  inView: boolean;
  prefersReduced?: boolean;
};

/**
 * Speedometer GLB with animated needle.
 *
 * On scroll entry (`inView`) the needle lerps from NEEDLE_REST to NEEDLE_GOOD.
 * With `prefersReduced` the needle snaps instead of lerping.
 * Float idle animation is disabled when prefersReduced or on mobile.
 */
export default function SpeedometerModel({
  inView,
  prefersReduced = false,
}: Props) {
  const { scene } = useGLTF("/models/speedometer.glb?v=3");
  const cloned = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<Group>(null);
  const needleRef = useRef<Object3D | null>(null);
  const currentAngle = useRef(NEEDLE_REST);

  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = TARGET_SIZE / maxDim;

    group.scale.setScalar(scale);
    group.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    let found: Object3D | null = null;
    cloned.traverse((obj) => {
      if (found) return;
      const name = obj.name.toLowerCase();
      if (NEEDLE_KEYWORDS.some((k) => name.includes(k))) {
        found = obj;
      }
    });
    if (!found && cloned.children.length > 1) {
      found = cloned.children[1];
    }
    needleRef.current = found;
    if (found) found.rotation.z = NEEDLE_REST;
  }, [cloned]);

  useFrame((state, delta) => {
    const target = inView ? NEEDLE_GOOD : NEEDLE_REST;
    if (prefersReduced) {
      currentAngle.current = target;
    } else {
      currentAngle.current +=
        (target - currentAngle.current) * Math.min(delta * 2.2, 1);
    }
    if (needleRef.current) {
      needleRef.current.rotation.z = currentAngle.current;
    }
    if (Math.abs(currentAngle.current - target) > 0.001) {
      state.invalidate();
    }
  });

  const disableFloat = prefersReduced || isMobile;

  const content = (
    <>
      {/* scale and position set imperatively in useEffect after Box3 fit */}
      <group ref={groupRef}>
        <primitive object={cloned} />
      </group>
      <HotspotDot
        position={[0, 1.3, 0.4]}
        label="P75 LCP tracked"
        description="Real-user metrics, not Lighthouse simulations. PERCENTILE_CONT(0.75) aggregated natively in Postgres."
        direction="up"
      />
      <HotspotDot
        position={[-1.2, 0.1, 0.4]}
        label="Route-level data"
        description="Metrics aggregated per route so slow pages can't hide behind a fast homepage."
      />
      <HotspotDot
        position={[1.2, 0.1, 0.4]}
        label="Semver filtering"
        description="Compare metrics across deploys to catch regressions introduced by a specific release."
      />
    </>
  );

  if (disableFloat) return content;

  return (
    <Float speed={0.7} rotationIntensity={0.04} floatIntensity={0.14}>
      {content}
    </Float>
  );
}
