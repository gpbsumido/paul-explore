"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type { Group } from "three";
import HotspotDot from "../HotspotDot";

const MARKER_RADIUS = 0.85;
const MAJOR_TICKS = new Set([0, 3, 6, 9]);

const MARKER_POSITIONS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return [Math.sin(a) * MARKER_RADIUS, Math.cos(a) * MARKER_RADIUS] as [
    number,
    number,
  ];
});

/**
 * Procedural alarm clock face. Uses volumetric geometry (cylinder body,
 * torus rim, sphere markers) so the model looks correct from all viewing
 * angles — flat circleGeometry becomes invisible when rotated past 90°.
 *
 * Hour and minute hands rotate in real time via useFrame.
 */
export default function CalendarModel() {
  const hourRef = useRef<Group>(null);
  const minuteRef = useRef<Group>(null);

  useEffect(() => {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const tau = Math.PI * 2;
    if (hourRef.current)
      hourRef.current.rotation.z = -((h / 12 + m / 720) * tau);
    if (minuteRef.current)
      minuteRef.current.rotation.z = -((m / 60 + s / 3600) * tau);
  }, []);

  useFrame(() => {
    if (!hourRef.current || !minuteRef.current) return;
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const tau = Math.PI * 2;
    hourRef.current.rotation.z = -((h / 12 + m / 720) * tau);
    minuteRef.current.rotation.z = -((m / 60 + s / 3600) * tau);
  });

  return (
    // rotationIntensity 0 keeps the face toward the camera — only a gentle bob.
    <Float speed={0.9} rotationIntensity={0.04} floatIntensity={0.18}>
      <group>
        {/* Clock body — flat cylinder visible from all sides.
            Rotated X PI/2 so front cap faces +Z (toward camera).
            Front cap at z = +0.11, back cap at z = -0.11. */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 0.22, 64]} />
          <meshStandardMaterial
            color="#08081a"
            metalness={0.1}
            roughness={0.8}
          />
        </mesh>

        {/* Rim torus — wraps the cylinder edge, visible from all angles */}
        <mesh>
          <torusGeometry args={[1.1, 0.1, 10, 64]} />
          <meshStandardMaterial
            color="#0d9488"
            emissive="#0d9488"
            emissiveIntensity={0.22}
            metalness={0.45}
            roughness={0.4}
          />
        </mesh>

        {/* Hour markers — spheres protrude above the front cap (z > 0.11) */}
        {MARKER_POSITIONS.map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.14]}>
            <sphereGeometry
              args={[MAJOR_TICKS.has(i) ? 0.052 : 0.03, 10, 10]}
            />
            <meshStandardMaterial
              color={MAJOR_TICKS.has(i) ? "#2dd4bf" : "#4b5563"}
              emissive={MAJOR_TICKS.has(i) ? "#2dd4bf" : "#000000"}
              emissiveIntensity={MAJOR_TICKS.has(i) ? 0.55 : 0}
            />
          </mesh>
        ))}

        {/* Hour hand — pivots at origin, body offset +Y */}
        <group ref={hourRef} position={[0, 0, 0.16]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.09, 0.44, 0.035]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.09, 0.12, 0.035]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
        </group>

        {/* Minute hand — longer, teal */}
        <group ref={minuteRef} position={[0, 0, 0.19]}>
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.055, 0.68, 0.035]} />
            <meshStandardMaterial
              color="#2dd4bf"
              emissive="#2dd4bf"
              emissiveIntensity={0.32}
            />
          </mesh>
          <mesh position={[0, -0.09, 0]}>
            <boxGeometry args={[0.055, 0.14, 0.035]} />
            <meshStandardMaterial
              color="#2dd4bf"
              emissive="#2dd4bf"
              emissiveIntensity={0.32}
            />
          </mesh>
        </group>

        {/* Center pin — sphere so it reads from all angles */}
        <mesh position={[0, 0, 0.22]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={1.0}
          />
        </mesh>

        <HotspotDot
          position={[0, 0.5, 0.28]}
          label="Custom Calendar Engine"
          description="No FullCalendar — date-fns overlap detection handles multi-day events, all-day rows, and side-by-side conflicts."
          direction="up"
        />
        <HotspotDot
          position={[-0.62, -0.26, 0.28]}
          label="Google Calendar Sync"
          description="Bidirectional sync via webhook — events created anywhere stay in sync."
        />
        <HotspotDot
          position={[0.58, -0.4, 0.28]}
          label="Optimistic Updates"
          description="Changes appear instantly, rollback on error — no loading spinners after an edit."
        />
      </group>
    </Float>
  );
}
