"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ROADS, BUILDINGS, LAKE_EDGE_Z, STREETCAR_ROUTE } from "@/lib/world/cityLayout";
import { WORLD_BOUNDS } from "@/lib/world/movement";
import { makeWindowTexture, makeDashTexture } from "./textures";

const hash01 = (n: number) => Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;

// ---------------------------------------------------------------------------
// Instanced skyline — one draw call for every generic tower downtown.
// ---------------------------------------------------------------------------

function Buildings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { geometry, materials } = useMemo(() => {
    const windowTexture = makeWindowTexture();
    const facade = new THREE.MeshStandardMaterial({
      map: windowTexture,
      emissiveMap: windowTexture,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.55,
      roughness: 0.85,
    });
    const roof = new THREE.MeshStandardMaterial({ color: "#181d28", roughness: 0.95 });
    return {
      geometry: new THREE.BoxGeometry(1, 1, 1),
      // Box face order: +x, -x, +y, -y, +z, -z — windows on walls, plain roof.
      materials: [facade, facade, roof, roof, facade, facade],
    };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      materials[0].map?.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [geometry, materials]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const base = new THREE.Color("#39445c");
    const accent = new THREE.Color("#55688c");
    const color = new THREE.Color();
    BUILDINGS.forEach((building, i) => {
      dummy.position.set(building.x, building.height / 2, building.z);
      dummy.scale.set(building.width, building.height, building.depth);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.copy(base).lerp(accent, building.tint);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return <instancedMesh ref={meshRef} args={[geometry, materials, BUILDINGS.length]} />;
}

// ---------------------------------------------------------------------------
// Roads with dashed center lines.
// ---------------------------------------------------------------------------

function Roads() {
  // one dash texture per road so each can repeat to its own length
  const dashTextures = useMemo(
    () =>
      ROADS.map((road) => {
        const texture = makeDashTexture();
        texture.repeat.set((road.to - road.from) / 7, 1);
        return texture;
      }),
    [],
  );
  useEffect(() => () => dashTextures.forEach((t) => t.dispose()), [dashTextures]);

  return (
    <group>
      {ROADS.map((road, roadIndex) => {
        const length = road.to - road.from;
        const mid = (road.from + road.to) / 2;
        const isNS = road.orientation === "ns";
        const dash = dashTextures[roadIndex];
        return (
          <group
            key={road.name}
            position={isNS ? [road.at, 0, mid] : [mid, 0, road.at]}
            rotation={[0, isNS ? Math.PI / 2 : 0, 0]}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[length, road.width]} />
              <meshStandardMaterial color="#242b3a" roughness={0.95} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
              <planeGeometry args={[length, 0.35]} />
              <meshBasicMaterial map={dash} transparent opacity={0.65} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// The 501 Queen streetcar, shuttling east and west.
// ---------------------------------------------------------------------------

function Streetcar({ prefersReduced }: { readonly prefersReduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const travelRef = useRef({ x: 10, direction: 1 });

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group || prefersReduced) return;
    const travel = travelRef.current;
    travel.x += travel.direction * 7 * dt;
    if (travel.x > STREETCAR_ROUTE.maxX) travel.direction = -1;
    if (travel.x < STREETCAR_ROUTE.minX) travel.direction = 1;
    group.position.x = travel.x;
    group.rotation.y = travel.direction > 0 ? 0 : Math.PI;
  });

  return (
    <group ref={groupRef} position={[10, 0, STREETCAR_ROUTE.z]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[7, 1.9, 2.2]} />
        <meshStandardMaterial color="#c8102e" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[6.6, 0.7, 2.24]} />
        <meshStandardMaterial
          color="#ffd9a0"
          emissive="#ffd9a0"
          emissiveIntensity={0.8}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[6.8, 0.25, 2]} />
        <meshStandardMaterial color="#8e0b20" roughness={0.6} />
      </mesh>
      {/* pantograph */}
      <mesh position={[-1, 2.7, 0]} rotation={[0, 0, 0.6]}>
        <boxGeometry args={[1.6, 0.06, 0.06]} />
        <meshStandardMaterial color="#2a2e38" />
      </mesh>
      {/* headlight */}
      <mesh position={[3.55, 0.9, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial color="#fff6d8" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.4, 2.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Lamps, trees, sky, water.
// ---------------------------------------------------------------------------

const LAMP_ROADS = ["Queen St W", "Front St W", "Dundas St W", "College St", "Yonge St"];

function StreetLamps() {
  const lamps = useMemo(
    () =>
      ROADS.filter((road) => LAMP_ROADS.includes(road.name)).flatMap((road) => {
        const count = Math.floor((road.to - road.from) / 24);
        return Array.from({ length: count }, (_, i) => {
          const along = road.from + 12 + i * 24;
          const side = road.width / 2 + 1.2;
          return road.orientation === "ns"
            ? { x: road.at + side, z: along }
            : { x: along, z: road.at + side };
        });
      }),
    [],
  );

  return (
    <group>
      {lamps.map((lamp, i) => (
        <group key={i} position={[lamp.x, 0, lamp.z]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 3.2, 6]} />
            <meshStandardMaterial color="#2a303c" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.3, 0]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshBasicMaterial color="#ffd9a0" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const TREE_SPOTS: readonly { x: number; z: number }[] = [
  { x: -40, z: -68 }, { x: -21, z: -72 }, { x: -38, z: -74 }, { x: -22, z: -64 },
  { x: -10, z: -66 }, { x: 10, z: -68 }, { x: -4, z: -78 }, { x: 14, z: -76 },
  { x: -28, z: -16 }, { x: -8, z: -18 }, { x: -30, z: -24 },
  { x: -68, z: 34 }, { x: -30, z: 50 }, { x: -20, z: 51 }, { x: 24, z: 50 },
  { x: 36, z: 51 }, { x: 52, z: 50 }, { x: 66, z: 48 }, { x: -48, z: 51 },
  { x: 66, z: 24 }, { x: 60, z: 14 }, { x: -74, z: -34 }, { x: -66, z: -58 },
];

function Trees() {
  return (
    <group>
      {TREE_SPOTS.map((spot, i) => {
        const scale = 0.8 + hash01(i) * 0.5;
        return (
          <group key={i} position={[spot.x, 0, spot.z]} scale={scale}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.12, 0.18, 1, 6]} />
              <meshStandardMaterial color="#3b2d22" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <coneGeometry args={[0.9, 2.2, 8]} />
              <meshStandardMaterial color="#1e3a2a" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Sky() {
  const starPositions = useMemo(() => {
    const positions = new Float32Array(380 * 3);
    for (let i = 0; i < 380; i += 1) {
      const azimuth = hash01(i * 3) * Math.PI * 2;
      const altitude = hash01(i * 3 + 1) * Math.PI * 0.48;
      const radius = 170;
      positions[i * 3] = Math.cos(azimuth) * Math.cos(altitude) * radius;
      positions[i * 3 + 1] = 12 + Math.sin(altitude) * radius * 0.7;
      positions[i * 3 + 2] = Math.sin(azimuth) * Math.cos(altitude) * radius;
    }
    return positions;
  }, []);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.4}
          sizeAttenuation={false}
          color="#cdd8ff"
          transparent
          opacity={0.75}
          depthWrite={false}
          fog={false}
        />
      </points>
      {/* the moon, hanging north-east over the city */}
      <mesh position={[58, 74, -130]}>
        <circleGeometry args={[7, 32]} />
        <meshBasicMaterial color="#f2eedd" fog={false} />
      </mesh>
      <mesh position={[58, 74, -129.5]}>
        <circleGeometry args={[11, 32]} />
        <meshBasicMaterial color="#f2eedd" transparent opacity={0.12} fog={false} />
      </mesh>
    </group>
  );
}

function Lake() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, LAKE_EDGE_Z + 25]}>
        <planeGeometry args={[190, 60]} />
        <meshStandardMaterial color="#0b1c33" roughness={0.25} metalness={0.4} />
      </mesh>
      {/* moonlight glint on the water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[45, 0.01, LAKE_EDGE_Z + 18]}>
        <planeGeometry args={[10, 34]} />
        <meshBasicMaterial color="#b9d4ff" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {/* Toronto Islands, a dark silhouette across the harbour */}
      <mesh position={[20, 0.4, LAKE_EDGE_Z + 22]}>
        <boxGeometry args={[54, 1, 6]} />
        <meshStandardMaterial color="#101820" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

type CitySceneProps = {
  readonly prefersReduced: boolean;
};

/** Everything that makes it Toronto at night except the landmark set pieces. */
export default function CityScene({ prefersReduced }: CitySceneProps) {
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -12]}>
        <planeGeometry args={[190, 160]} />
        <meshStandardMaterial color="#181d2a" roughness={1} />
      </mesh>
      {/* parks read slightly green even at night */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, 0.01, -69]}>
        <planeGeometry args={[26, 20]} />
        <meshStandardMaterial color="#16241d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -71]}>
        <planeGeometry args={[27, 15]} />
        <meshStandardMaterial color="#16241d" roughness={1} />
      </mesh>
      {/* waterfront boardwalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, (WORLD_BOUNDS.maxZ + LAKE_EDGE_Z) / 2 - 2]}>
        <planeGeometry args={[160, 8]} />
        <meshStandardMaterial color="#2b241c" roughness={0.95} />
      </mesh>
      <Roads />
      <Buildings />
      <StreetLamps />
      <Trees />
      <Streetcar prefersReduced={prefersReduced} />
      <Lake />
      <Sky />
    </group>
  );
}
