"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { WeatherCondition } from "@/hooks/useWeather";
import { WEATHER_DRESSING, precipitationCount } from "@/lib/world/weather";
import { useDetail } from "./detail";

// Precipitation falls inside a box that travels with the camera, so a
// modest particle count covers the whole visible city.
const FIELD = 90;
const CEILING = 42;

type WeatherProps = {
  readonly condition: WeatherCondition;
  readonly prefersReduced: boolean;
};

/** Rain, snow, and the odd flash of lightning, driven by the real forecast. */
export default function Weather({ condition, prefersReduced }: WeatherProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const nextFlashRef = useRef(6);
  const dressing = WEATHER_DRESSING[condition];
  const fidelity = useDetail();
  const count = prefersReduced ? 0 : precipitationCount(condition, fidelity);

  const { positions, drifts } = useMemo(() => {
    // Hash-scattered rather than random so a re-render never reshuffles the sky.
    const scatter = (n: number) =>
      Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
    const pos = new Float32Array(Math.max(count, 1) * 3);
    const drift = new Float32Array(Math.max(count, 1));
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (scatter(i * 3) - 0.5) * FIELD;
      pos[i * 3 + 1] = scatter(i * 3 + 1) * CEILING;
      pos[i * 3 + 2] = (scatter(i * 3 + 2) - 0.5) * FIELD;
      drift[i] = (scatter(i * 7) - 0.5) * 2;
    }
    return { positions: pos, drifts: drift };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera, clock }, dt) => {
    const points = pointsRef.current;
    if (points && count > 0) {
      const attribute = geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const array = attribute.array as Float32Array;
      const snowy = dressing.precipitation === "snow";
      for (let i = 0; i < count; i += 1) {
        const yIndex = i * 3 + 1;
        array[yIndex] -= dressing.fallSpeed * dt;
        if (snowy) {
          // Snow wanders on the way down; rain does not.
          array[i * 3] +=
            Math.sin(clock.elapsedTime * 0.8 + i) * drifts[i] * dt;
        }
        if (array[yIndex] < 0) {
          array[yIndex] = CEILING;
          array[i * 3] = camera.position.x + (Math.random() - 0.5) * FIELD;
          array[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * FIELD;
        }
      }
      attribute.needsUpdate = true;
      // Keep the field centred on the view without moving the particles.
      points.position.set(0, 0, 0);
    }

    const flash = flashRef.current;
    if (flash && dressing.lightning && !prefersReduced) {
      const now = clock.elapsedTime;
      if (now > nextFlashRef.current) {
        flash.intensity = 900;
        nextFlashRef.current = now + 4 + Math.random() * 9;
      }
      flash.intensity *= Math.exp(-9 * dt);
      flash.position.set(camera.position.x + 20, 60, camera.position.z - 40);
    }
  });

  return (
    <group>
      {count > 0 && (
        <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
          <pointsMaterial
            size={dressing.precipitation === "snow" ? 0.5 : 0.22}
            sizeAttenuation
            color={dressing.precipitation === "snow" ? "#eef4ff" : "#9fc0e8"}
            transparent
            opacity={dressing.precipitation === "snow" ? 0.9 : 0.55}
            depthWrite={false}
          />
        </points>
      )}
      {dressing.lightning && !prefersReduced && (
        <pointLight
          ref={flashRef}
          intensity={0}
          distance={400}
          decay={1.4}
          color="#dce8ff"
        />
      )}
    </group>
  );
}
