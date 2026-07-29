"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { LANDMARKS } from "@/lib/world/cityLayout";
import type { SkyPreset } from "./skyPresets";
import { useSegments } from "./detail";
import { makeTextTexture, makeCheckerTexture, makeWindowTexture } from "./textures";

const SIGN_COLORS = ["#38bdf8", "#f472b6", "#fbbf24", "#4ade80", "#a78bfa", "#f87171", "#22d3ee"];

function useDisposableTexture(make: () => THREE.CanvasTexture) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- textures are created once per mount; callers pass inline factories
  const texture = useMemo(() => make(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** Warm interior-light plane; fades right down when it isn't dark out. */
function WarmGlow({
  night,
  opacity,
  position,
  rotation,
  size,
}: {
  readonly night: boolean;
  readonly opacity: number;
  readonly position: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly size: readonly [number, number];
}) {
  return (
    <mesh position={[...position]} rotation={rotation ? [...rotation] : [0, 0, 0]}>
      <planeGeometry args={[...size]} />
      <meshBasicMaterial
        color="#ffd9a0"
        transparent
        opacity={night ? opacity : opacity * 0.25}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------

function CNTower({ prefersReduced }: { readonly prefersReduced: boolean }) {
  const beaconRef = useRef<THREE.MeshBasicMaterial>(null);
  const round = useSegments(24);
  const { x, z } = LANDMARKS.cnTower;

  useFrame(({ clock }) => {
    if (!beaconRef.current || prefersReduced) return;
    beaconRef.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 2.4) * 0.5;
  });

  return (
    <group position={[x, 0, z]}>
      {/* the tripod base: three fins in a Y, like the real cross-section */}
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((angle) => (
        <mesh key={angle} position={[0, 6, 0]} rotation={[0, angle, 0]}>
          <boxGeometry args={[3.4, 12, 0.6]} />
          <meshStandardMaterial color="#98a2b4" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 17, 0]}>
        <cylinderGeometry args={[0.65, 1.4, 28, round]} />
        <meshStandardMaterial color="#a7b0c0" roughness={0.6} />
      </mesh>
      {/* glass floor ledge below the pod */}
      <mesh position={[0, 30.4, 0]} scale={[1, 0.25, 1]}>
        <cylinderGeometry args={[1.9, 1.6, 2, round]} />
        <meshStandardMaterial color="#5d6a80" roughness={0.4} />
      </mesh>
      {/* main pod */}
      <mesh position={[0, 32, 0]}>
        <sphereGeometry args={[2.4, round + 8, Math.ceil(round * 0.75)]} />
        <meshStandardMaterial color="#b7c0d0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 32, 0]} scale={[1, 0.32, 1]}>
        <torusGeometry args={[2.5, 0.35, Math.ceil(round / 2), round * 2]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.4}
          roughness={0.4}
        />
      </mesh>
      {/* skypod + antenna */}
      <mesh position={[0, 37.5, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 8, round]} />
        <meshStandardMaterial color="#a7b0c0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 44.5, 0]}>
        <cylinderGeometry args={[0.08, 0.18, 7, Math.ceil(round / 2)]} />
        <meshStandardMaterial color="#c5cdd9" roughness={0.5} />
      </mesh>
      <mesh position={[0, 48.2, 0]}>
        <sphereGeometry args={[0.32, 12, 10]} />
        <meshBasicMaterial ref={beaconRef} color="#ff3b30" transparent />
      </mesh>
    </group>
  );
}

function RogersCentre() {
  const round = useSegments(32);
  const { x, z } = LANDMARKS.rogersCentre;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[8.6, 9, 2.4, round]} />
        <meshStandardMaterial color="#5c6474" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.4, 0]} scale={[1, 0.55, 0.92]}>
        <sphereGeometry args={[8, round, Math.ceil(round * 0.6), 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dde2ea" roughness={0.55} />
      </mesh>
      {/* the segmented roof ribs */}
      {[0.35, 0.75, 1.15].map((angle) => (
        <mesh key={angle} position={[0, 2.4, 0]} rotation={[0, angle, 0]} scale={[1, 0.57, 1]}>
          <torusGeometry args={[7.9, 0.18, 8, round * 2, Math.PI]} />
          <meshStandardMaterial color="#f0f3f7" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function ScotiabankArena({ night }: { readonly night: boolean }) {
  const sign = useDisposableTexture(() =>
    makeTextTexture("ARENA", { fontSize: 56, color: "#ffffff" }),
  );
  const round = useSegments(28);
  const { x, z } = LANDMARKS.scotiabankArena;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[14, 5, 8]} />
        <meshStandardMaterial color="#3a4356" roughness={0.7} />
      </mesh>
      {/* curved silver roof over the bowl */}
      <mesh position={[0, 5.2, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.5, 1, 1]}>
        <cylinderGeometry args={[4.2, 4.2, 13.6, round, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#9aa3b0" roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.4, -4.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[5, 1.2]} />
        <meshBasicMaterial map={sign} transparent opacity={night ? 1 : 0.8} />
      </mesh>
      <mesh position={[-5.6, 3.4, -4.05]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.8, round]} />
        <meshBasicMaterial color="#ce0e2d" />
      </mesh>
    </group>
  );
}

function UnionStation({ night }: { readonly night: boolean }) {
  const sign = useDisposableTexture(() =>
    makeTextTexture("UNION STATION", { fontSize: 44, color: "#ffe9c4" }),
  );
  const round = useSegments(12);
  const { x, z } = LANDMARKS.unionStation;
  const columns = useMemo(() => Array.from({ length: 9 }, (_, i) => -8.8 + i * 2.2), []);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[22, 4.8, 6]} />
        <meshStandardMaterial color="#6a6f7c" roughness={0.75} />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[23, 0.8, 6.6]} />
        <meshStandardMaterial color="#575c68" roughness={0.8} />
      </mesh>
      {/* raised center hall with its pediment */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[9, 1.6, 5.8]} />
        <meshStandardMaterial color="#6a6f7c" roughness={0.75} />
      </mesh>
      <mesh position={[0, 7.2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.6, 1, 1]}>
        <coneGeometry args={[3.4, 1.1, 4]} />
        <meshStandardMaterial color="#575c68" roughness={0.8} />
      </mesh>
      {columns.map((cx) => (
        <mesh key={cx} position={[cx, 1.9, -3.2]}>
          <cylinderGeometry args={[0.28, 0.3, 3.8, round]} />
          <meshStandardMaterial color="#8a8f9c" roughness={0.6} />
        </mesh>
      ))}
      <WarmGlow night={night} opacity={0.5} position={[0, 2.2, -3.01]} rotation={[0, Math.PI, 0]} size={[21, 1.6]} />
      <mesh position={[0, 4.4, -3.35]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[8.5, 1]} />
        <meshBasicMaterial map={sign} transparent />
      </mesh>
    </group>
  );
}

const FESTIVE_COLORS = ["#e5484d", "#4ade80", "#fbbf24", "#38bdf8", "#f472b6"];

function CityHall({ festive }: { readonly festive: boolean }) {
  const round = useSegments(32);
  const { x, z } = LANDMARKS.cityHall;
  return (
    <group position={[x, 0, z]}>
      {/* holiday lights strung across the square in December */}
      {festive &&
        Array.from({ length: 18 }, (_, i) => {
          const t = i / 17;
          return (
            <mesh key={i} position={[-8 + t * 16, 3.4 + Math.sin(t * Math.PI) * 1.4, 5]}>
              <sphereGeometry args={[0.13, 8, 8]} />
              <meshBasicMaterial color={FESTIVE_COLORS[i % FESTIVE_COLORS.length]} />
            </mesh>
          );
        })}
      {/* two curved towers facing each other over the saucer — the east one is
          taller, as in life */}
      <mesh position={[-4, 6, 0]} rotation={[0, Math.PI * 0.5, 0]}>
        <cylinderGeometry args={[3.6, 3.6, 12, round, 1, true, 0, Math.PI * 0.9]} />
        <meshStandardMaterial color="#c9cfd8" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[4.2, 8.5, 0]} rotation={[0, -Math.PI * 0.5, 0]}>
        <cylinderGeometry args={[4, 4, 17, round, 1, true, 0, Math.PI * 0.9]} />
        <meshStandardMaterial color="#c9cfd8" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* council chamber saucer */}
      <mesh position={[0, 2.2, 0]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[2.6, round, Math.ceil(round * 0.6)]} />
        <meshStandardMaterial color="#aeb6c2" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[14, 1.2, 6]} />
        <meshStandardMaterial color="#7d8492" roughness={0.8} />
      </mesh>
    </group>
  );
}

function TorontoSign({ prefersReduced }: { readonly prefersReduced: boolean }) {
  const sign = useDisposableTexture(() =>
    makeTextTexture("🍁TORONTO", { fontSize: 88, letterColors: ["#e11d48", ...SIGN_COLORS] }),
  );
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const { x, z } = LANDMARKS.torontoSign;

  useFrame(({ clock }) => {
    if (!glowRef.current || prefersReduced) return;
    glowRef.current.opacity = 0.16 + Math.sin(clock.elapsedTime * 1.2) * 0.05;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[10.4, 0.5, 1.4]} />
        <meshStandardMaterial color="#20242e" roughness={0.9} />
      </mesh>
      {/* the letters face south toward the square and Queen St */}
      <mesh position={[0, 1.45, 0.2]}>
        <planeGeometry args={[9.6, 1.9]} />
        <meshBasicMaterial map={sign} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.51, 1.6]}>
        <planeGeometry args={[11, 2.4]} />
        <meshBasicMaterial ref={glowRef} color="#7dd3fc" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

function EatonCentre() {
  const glass = useDisposableTexture(() => makeWindowTexture(0.75, "#1c2740"));
  const round = useSegments(20);
  const { x, z } = LANDMARKS.eatonCentre;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[12, 9, 16]} />
        <meshStandardMaterial
          map={glass}
          emissiveMap={glass}
          emissive="#ffffff"
          emissiveIntensity={0.5}
          color="#94a8c8"
          roughness={0.4}
        />
      </mesh>
      {/* the galleria's barrel skylight */}
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 3, 15.6, round, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial
          color="#9fc4e8"
          emissive="#5b7ba8"
          emissiveIntensity={0.4}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function YongeDundasBillboards({ prefersReduced }: { readonly prefersReduced: boolean }) {
  const adOne = useDisposableTexture(() =>
    makeTextTexture("PAUL-EXPLORE", { fontSize: 52, color: "#0b0e14", background: "#7dd3fc" }),
  );
  const adTwo = useDisposableTexture(() =>
    makeTextTexture("EXPLORE MORE →", { fontSize: 48, color: "#ffffff", background: "#e11d48" }),
  );
  const adThree = useDisposableTexture(() =>
    makeTextTexture("VITALS: ALL GREEN", { fontSize: 44, color: "#052e16", background: "#4ade80" }),
  );
  const flickerRef = useRef<THREE.MeshBasicMaterial>(null);
  const { x, z } = LANDMARKS.ydBillboards;

  useFrame(({ clock }) => {
    if (!flickerRef.current || prefersReduced) return;
    const t = clock.elapsedTime;
    flickerRef.current.opacity = 0.92 + Math.sin(t * 9) * Math.sin(t * 2.3) * 0.08;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[12, 12, 8]} />
        <meshStandardMaterial color="#2c3342" roughness={0.85} />
      </mesh>
      {/* billboards face the square to the south */}
      <mesh position={[-2.6, 8.4, 4.06]}>
        <planeGeometry args={[6, 2.2]} />
        <meshBasicMaterial map={adOne} transparent />
      </mesh>
      <mesh position={[3.4, 5.4, 4.06]}>
        <planeGeometry args={[4.6, 1.8]} />
        <meshBasicMaterial ref={flickerRef} map={adTwo} transparent />
      </mesh>
      <mesh position={[-1.4, 2.6, 4.06]}>
        <planeGeometry args={[5.4, 1.6]} />
        <meshBasicMaterial map={adThree} transparent />
      </mesh>
    </group>
  );
}

function AGO() {
  const { x, z } = LANDMARKS.ago;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[16, 3, 5]} />
        <meshStandardMaterial color="#464d5a" roughness={0.8} />
      </mesh>
      {/* Gehry's curved glass visor, bulging north over Dundas */}
      <mesh position={[0, 4.6, -0.8]} rotation={[0, 0, Math.PI / 2]} scale={[0.9, 1, 1]}>
        <cylinderGeometry args={[2.6, 2.6, 17.6, 24, 1, true, 0, Math.PI]} />
        <meshStandardMaterial
          color="#5e8cb8"
          emissive="#274a70"
          emissiveIntensity={0.5}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the blue titanium box rising behind */}
      <mesh position={[0, 6.2, 1.6]}>
        <boxGeometry args={[10, 4, 2.4]} />
        <meshStandardMaterial color="#28527e" roughness={0.4} />
      </mesh>
      <mesh position={[0, 3.1, 2.35]}>
        <boxGeometry args={[17, 0.15, 0.15]} />
        <meshStandardMaterial color="#94b8d8" emissive="#94b8d8" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

const OCAD_STILT_COLORS = ["#f43f5e", "#fbbf24", "#38bdf8", "#a3e635", "#a78bfa", "#f9a8d4"];

function OCAD() {
  const checker = useDisposableTexture(makeCheckerTexture);
  const round = useSegments(10);
  const { x, z } = LANDMARKS.ocad;
  const stilts = useMemo(
    () =>
      OCAD_STILT_COLORS.map((color, i) => ({
        color,
        x: -5 + (i % 3) * 5,
        z: i < 3 ? -2 : 2,
        tiltX: (Math.sin(i * 5.3) * Math.PI) / 22,
        tiltZ: (Math.cos(i * 3.7) * Math.PI) / 22,
      })),
    [],
  );
  return (
    <group position={[x, 0, z]}>
      {/* the tabletop floats — you can walk right under it */}
      <mesh position={[0, 8.4, 0]}>
        <boxGeometry args={[13, 3.2, 6.5]} />
        <meshStandardMaterial map={checker} roughness={0.7} />
      </mesh>
      {stilts.map((stilt, i) => (
        <mesh
          key={i}
          position={[stilt.x, 3.4, stilt.z]}
          rotation={[stilt.tiltX, 0, stilt.tiltZ]}
        >
          <cylinderGeometry args={[0.16, 0.16, 6.9, round]} />
          <meshStandardMaterial color={stilt.color} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[4, 1.8, 3]} />
        <meshStandardMaterial color="#343a47" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Flatiron({ night }: { readonly night: boolean }) {
  const wedge = useMemo(() => {
    // Footprint: a wedge pointing west, like the Gooderham at Front & Wellington.
    const shape = new THREE.Shape();
    shape.moveTo(-3, 0);
    shape.lineTo(3, -2);
    shape.lineTo(3, 2);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false });
  }, []);
  useEffect(() => () => wedge.dispose(), [wedge]);
  const { x, z } = LANDMARKS.flatiron;
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={wedge} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8a5344" roughness={0.85} />
      </mesh>
      <mesh geometry={wedge} rotation={[-Math.PI / 2, 0, 0]} position={[0, 5, 0]} scale={[1.06, 1.15, 0.16]}>
        <meshStandardMaterial color="#3f5a4c" roughness={0.7} />
      </mesh>
      <WarmGlow night={night} opacity={0.28} position={[0.4, 2.6, 2.06]} size={[4.6, 2.4]} />
    </group>
  );
}

function StLawrenceMarket({ night }: { readonly night: boolean }) {
  const round = useSegments(20);
  const { x, z } = LANDMARKS.stLawrenceMarket;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[16, 4, 7]} />
        <meshStandardMaterial color="#8a5140" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[3.4, 3.4, 15.6, round, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#4f6277" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <WarmGlow night={night} opacity={0.4} position={[0, 1.9, -3.51]} rotation={[0, Math.PI, 0]} size={[13, 1.8]} />
    </group>
  );
}

// Queen's Park: an oval park — lawn, crescent path, flower beds — with the
// pink sandstone legislature at its north end.
function QueensPark({ night, lawn }: { readonly night: boolean; readonly lawn: string }) {
  const round = useSegments(36);
  const { x, z } = LANDMARKS.queensPark;
  return (
    <group position={[x, 0, z]}>
      {/* oval lawn, south of the legislature */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 4]} scale={[14, 10, 1]}>
        <circleGeometry args={[1, round]} />
        <meshStandardMaterial color={lawn} roughness={1} />
      </mesh>
      {/* Queen's Park Crescent, the path looping the lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 4]} scale={[12, 8.4, 1]}>
        <ringGeometry args={[0.88, 1, round]} />
        <meshStandardMaterial color="#4d443a" roughness={0.95} />
      </mesh>
      {/* walkway up the middle to the front steps */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 7]}>
        <planeGeometry args={[2, 8]} />
        <meshStandardMaterial color="#4d443a" roughness={0.95} />
      </mesh>
      {/* flower beds */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.06, 8]} scale={[1.6, 1.1, 1]}>
        <circleGeometry args={[1, Math.ceil(round / 2)]} />
        <meshStandardMaterial color="#a3486e" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.06, 8]} scale={[1.6, 1.1, 1]}>
        <circleGeometry args={[1, Math.ceil(round / 2)]} />
        <meshStandardMaterial color="#c8a23e" roughness={0.9} />
      </mesh>

      {/* legislature: center block, mansard roof, tower, angled wings, steps */}
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[10, 4.8, 5]} />
        <meshStandardMaterial color="#9c6156" roughness={0.85} />
      </mesh>
      <mesh position={[0, 5.3, 0]}>
        <boxGeometry args={[10.5, 1.2, 5.5]} />
        <meshStandardMaterial color="#513f3b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 6.6, 0]}>
        <boxGeometry args={[3.2, 3, 3.2]} />
        <meshStandardMaterial color="#9c6156" roughness={0.85} />
      </mesh>
      <mesh position={[0, 9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.6, 2.2, 4]} />
        <meshStandardMaterial color="#3f5a4c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 10.3, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#c8a23e" roughness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 7.2, 0, 1]} rotation={[0, -side * 0.3, 0]}>
          <mesh position={[0, 1.9, 0]}>
            <boxGeometry args={[6, 3.8, 4]} />
            <meshStandardMaterial color="#9c6156" roughness={0.85} />
          </mesh>
          <mesh position={[0, 4.1, 0]}>
            <boxGeometry args={[6.4, 0.9, 4.4]} />
            <meshStandardMaterial color="#513f3b" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.25, 3.2]}>
        <boxGeometry args={[6, 0.5, 1.6]} />
        <meshStandardMaterial color="#7d8492" roughness={0.9} />
      </mesh>
      <WarmGlow night={night} opacity={0.35} position={[0, 2.2, 2.55]} size={[7, 2.2]} />
    </group>
  );
}

// U of T: two collegiate-gothic halls around King's College Circle.
function Campus({ night }: { readonly night: boolean }) {
  const round = useSegments(36);
  const { x, z } = LANDMARKS.campus;
  return (
    <group>
      {/* King's College Circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.055, z + 1]} scale={[7, 5.5, 1]}>
        <ringGeometry args={[0.85, 1, round]} />
        <meshStandardMaterial color="#4d443a" roughness={0.95} />
      </mesh>
      {[
        { hx: -52, hz: -73, w: 8, d: 5 },
        { hx: -40, hz: -76, w: 7, d: 5 },
      ].map((hall) => (
        <group key={hall.hx} position={[hall.hx, 0, hall.hz]}>
          <mesh position={[0, 1.75, 0]}>
            <boxGeometry args={[hall.w, 3.5, hall.d]} />
            <meshStandardMaterial color="#666c7a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 4.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[hall.w * 0.45, 1.8, 4]} />
            <meshStandardMaterial color="#42485a" roughness={0.85} />
          </mesh>
          {/* corner turret */}
          <mesh position={[hall.w / 2 - 0.6, 2.4, hall.d / 2 - 0.6]}>
            <cylinderGeometry args={[0.55, 0.55, 4.8, Math.ceil(round / 3)]} />
            <meshStandardMaterial color="#5d6371" roughness={0.9} />
          </mesh>
          <mesh position={[hall.w / 2 - 0.6, 5.2, hall.d / 2 - 0.6]}>
            <coneGeometry args={[0.7, 1.2, Math.ceil(round / 3)]} />
            <meshStandardMaterial color="#42485a" roughness={0.85} />
          </mesh>
          <WarmGlow night={night} opacity={0.3} position={[0, 1.6, hall.d / 2 + 0.05]} size={[hall.w - 2, 1.4]} />
        </group>
      ))}
    </group>
  );
}

const KENSINGTON_SHOPS = [
  { x: -73, z: -52, color: "#f472b6" },
  { x: -73, z: -45, color: "#fbbf24" },
  { x: -68, z: -54, color: "#4ade80" },
  { x: -67, z: -42, color: "#60a5fa" },
];

function Kensington({ night }: { readonly night: boolean }) {
  return (
    <group>
      {KENSINGTON_SHOPS.map((shop, i) => (
        <group key={i} position={[shop.x, 0, shop.z]}>
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={[4, 2.8, 4]} />
            <meshStandardMaterial color={shop.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.1, 2.2]} rotation={[0.5, 0, 0]}>
            <planeGeometry args={[3.6, 1.2]} />
            <meshStandardMaterial color="#f5f0e8" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          <WarmGlow night={night} opacity={0.45} position={[0, 1.1, 2.02]} size={[2.2, 1.2]} />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------

type LandmarksProps = {
  readonly prefersReduced: boolean;
  readonly preset: SkyPreset;
  readonly festive: boolean;
};

/** Every bespoke Toronto set piece, anchored to the shared city layout. */
export default function Landmarks({ prefersReduced, preset, festive }: LandmarksProps) {
  const night = preset.lampsOn;
  return (
    <group>
      <CNTower prefersReduced={prefersReduced} />
      <RogersCentre />
      <ScotiabankArena night={night} />
      <UnionStation night={night} />
      <CityHall festive={festive} />
      <TorontoSign prefersReduced={prefersReduced} />
      <EatonCentre />
      <YongeDundasBillboards prefersReduced={prefersReduced} />
      <AGO />
      <OCAD />
      <Flatiron night={night} />
      <StLawrenceMarket night={night} />
      <QueensPark night={night} lawn={preset.park} />
      <Campus night={night} />
      <Kensington night={night} />
    </group>
  );
}
