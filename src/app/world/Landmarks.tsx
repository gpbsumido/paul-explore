"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { LANDMARKS } from "@/lib/world/cityLayout";
import { makeTextTexture, makeCheckerTexture, makeWindowTexture } from "./textures";

const SIGN_COLORS = ["#38bdf8", "#f472b6", "#fbbf24", "#4ade80", "#a78bfa", "#f87171", "#22d3ee"];

function useDisposableTexture(make: () => THREE.CanvasTexture) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- textures are created once per mount; callers pass inline factories
  const texture = useMemo(() => make(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

// ---------------------------------------------------------------------------

function CNTower({ prefersReduced }: { readonly prefersReduced: boolean }) {
  const beaconRef = useRef<THREE.MeshBasicMaterial>(null);
  const { x, z } = LANDMARKS.cnTower;

  useFrame(({ clock }) => {
    if (!beaconRef.current || prefersReduced) return;
    beaconRef.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 2.4) * 0.5;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.6, 2.2, 3, 12]} />
        <meshStandardMaterial color="#8f99ab" roughness={0.7} />
      </mesh>
      <mesh position={[0, 17, 0]}>
        <cylinderGeometry args={[0.65, 1.4, 28, 12]} />
        <meshStandardMaterial color="#a7b0c0" roughness={0.6} />
      </mesh>
      {/* main pod */}
      <mesh position={[0, 32, 0]}>
        <sphereGeometry args={[2.4, 20, 14]} />
        <meshStandardMaterial color="#b7c0d0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 32, 0]} scale={[1, 0.32, 1]}>
        <torusGeometry args={[2.5, 0.35, 10, 28]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.4}
          roughness={0.4}
        />
      </mesh>
      {/* skypod + antenna */}
      <mesh position={[0, 37.5, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 8, 10]} />
        <meshStandardMaterial color="#a7b0c0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 44.5, 0]}>
        <cylinderGeometry args={[0.08, 0.18, 7, 8]} />
        <meshStandardMaterial color="#c5cdd9" roughness={0.5} />
      </mesh>
      <mesh position={[0, 48.2, 0]}>
        <sphereGeometry args={[0.32, 10, 8]} />
        <meshBasicMaterial ref={beaconRef} color="#ff3b30" transparent />
      </mesh>
    </group>
  );
}

function RogersCentre() {
  const { x, z } = LANDMARKS.rogersCentre;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[8.6, 9, 2.4, 24]} />
        <meshStandardMaterial color="#5c6474" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.4, 0]} scale={[1, 0.55, 0.92]}>
        <sphereGeometry args={[8, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dde2ea" roughness={0.55} />
      </mesh>
    </group>
  );
}

function ScotiabankArena() {
  const sign = useDisposableTexture(() =>
    makeTextTexture("ARENA", { fontSize: 56, color: "#ffffff" }),
  );
  const { x, z } = LANDMARKS.scotiabankArena;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[14, 5, 8]} />
        <meshStandardMaterial color="#333c4c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 5.4, 0]} scale={[1, 0.4, 1]}>
        <cylinderGeometry args={[6.4, 7, 2, 20]} />
        <meshStandardMaterial color="#3d4757" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.4, -4.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[5, 1.2]} />
        <meshBasicMaterial map={sign} transparent />
      </mesh>
      <mesh position={[-5.6, 3.4, -4.05]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.8, 20]} />
        <meshBasicMaterial color="#ce0e2d" />
      </mesh>
    </group>
  );
}

function UnionStation() {
  const sign = useDisposableTexture(() =>
    makeTextTexture("UNION STATION", { fontSize: 44, color: "#ffe9c4" }),
  );
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
      {columns.map((cx) => (
        <mesh key={cx} position={[cx, 1.9, -3.2]}>
          <cylinderGeometry args={[0.28, 0.3, 3.8, 8]} />
          <meshStandardMaterial color="#8a8f9c" roughness={0.6} />
        </mesh>
      ))}
      {/* warm window band behind the colonnade */}
      <mesh position={[0, 2.2, -3.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[21, 1.6]} />
        <meshBasicMaterial color="#ffd9a0" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 4.4, -3.35]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[8.5, 1]} />
        <meshBasicMaterial map={sign} transparent />
      </mesh>
    </group>
  );
}

function CityHall() {
  const { x, z } = LANDMARKS.cityHall;
  return (
    <group position={[x, 0, z]}>
      {/* two curved towers facing each other over the saucer */}
      <mesh position={[-4, 8, 0]} rotation={[0, Math.PI * 0.5, 0]}>
        <cylinderGeometry args={[4, 4, 16, 20, 1, true, 0, Math.PI * 0.9]} />
        <meshStandardMaterial color="#c9cfd8" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[4.2, 6, 0]} rotation={[0, -Math.PI * 0.5, 0]}>
        <cylinderGeometry args={[3.6, 3.6, 12, 20, 1, true, 0, Math.PI * 0.9]} />
        <meshStandardMaterial color="#c9cfd8" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* council chamber saucer */}
      <mesh position={[0, 2.2, 0]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[2.6, 18, 12]} />
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
    makeTextTexture("TORONTO", { fontSize: 88, letterColors: SIGN_COLORS }),
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
  const glass = useDisposableTexture(() => makeWindowTexture(0.75, "#182238"));
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
        <cylinderGeometry args={[3, 3, 15.6, 16, 1, false, -Math.PI / 2, Math.PI]} />
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
        <meshStandardMaterial color="#252b38" roughness={0.85} />
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
        <meshStandardMaterial color="#3d434f" roughness={0.8} />
      </mesh>
      {/* Gehry's floating glass visor */}
      <mesh position={[0, 4.4, -0.4]}>
        <boxGeometry args={[18, 2.6, 5.4]} />
        <meshStandardMaterial
          color="#3e6a96"
          emissive="#274a70"
          emissiveIntensity={0.5}
          roughness={0.25}
        />
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
          <cylinderGeometry args={[0.16, 0.16, 6.9, 8]} />
          <meshStandardMaterial color={stilt.color} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[4, 1.8, 3]} />
        <meshStandardMaterial color="#2c313c" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Flatiron() {
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
        <meshStandardMaterial color="#7d4a3a" roughness={0.85} />
      </mesh>
      <mesh geometry={wedge} rotation={[-Math.PI / 2, 0, 0]} position={[0, 5, 0]} scale={[1.06, 1.15, 0.16]}>
        <meshStandardMaterial color="#3f5a4c" roughness={0.7} />
      </mesh>
      {/* warm little windows on the south face */}
      <mesh position={[0.4, 2.6, 2.06]} rotation={[0, 0, 0]}>
        <planeGeometry args={[4.6, 2.4]} />
        <meshBasicMaterial color="#ffd9a0" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

function StLawrenceMarket() {
  const { x, z } = LANDMARKS.stLawrenceMarket;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[16, 4, 7]} />
        <meshStandardMaterial color="#7c4636" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[3.4, 3.4, 15.6, 14, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#46586b" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.9, -3.51]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[13, 1.8]} />
        <meshBasicMaterial color="#ffd9a0" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function QueensPark() {
  const { x, z } = LANDMARKS.queensPark;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[16, 4.8, 8]} />
        <meshStandardMaterial color="#8d5a50" roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.4, 0]}>
        <boxGeometry args={[4, 3.2, 4]} />
        <meshStandardMaterial color="#8d5a50" roughness={0.9} />
      </mesh>
      <mesh position={[0, 9.2, 0]}>
        <coneGeometry args={[2.9, 2.4, 4]} />
        <meshStandardMaterial color="#3f5a4c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.2, 4.05]}>
        <planeGeometry args={[3, 2.6]} />
        <meshBasicMaterial color="#ffd9a0" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

const KENSINGTON_SHOPS = [
  { x: -73, z: -52, color: "#f472b6" },
  { x: -73, z: -45, color: "#fbbf24" },
  { x: -68, z: -54, color: "#4ade80" },
  { x: -67, z: -42, color: "#60a5fa" },
];

function Kensington() {
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
          <mesh position={[0, 1.1, 2.02]}>
            <planeGeometry args={[2.2, 1.2]} />
            <meshBasicMaterial color="#ffd9a0" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Campus() {
  return (
    <group>
      {[-8, 8].map((cx) => (
        <group key={cx} position={[cx, 0, -74]}>
          <mesh position={[0, 1.75, 0]}>
            <boxGeometry args={[8, 3.5, 5]} />
            <meshStandardMaterial color="#5d6371" roughness={0.9} />
          </mesh>
          <mesh position={[0, 4.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[3.6, 1.8, 4]} />
            <meshStandardMaterial color="#3a404c" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.6, 2.55]}>
            <planeGeometry args={[6, 1.4]} />
            <meshBasicMaterial color="#ffd9a0" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------

type LandmarksProps = {
  readonly prefersReduced: boolean;
};

/** Every bespoke Toronto set piece, anchored to the shared city layout. */
export default function Landmarks({ prefersReduced }: LandmarksProps) {
  return (
    <group>
      <CNTower prefersReduced={prefersReduced} />
      <RogersCentre />
      <ScotiabankArena />
      <UnionStation />
      <CityHall />
      <TorontoSign prefersReduced={prefersReduced} />
      <EatonCentre />
      <YongeDundasBillboards prefersReduced={prefersReduced} />
      <AGO />
      <OCAD />
      <Flatiron />
      <StLawrenceMarket />
      <QueensPark />
      <Kensington />
      <Campus />
    </group>
  );
}
