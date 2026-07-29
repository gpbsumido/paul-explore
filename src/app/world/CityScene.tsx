"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ROADS, BUILDINGS, LAKE_EDGE_Z, STREETCAR_ROUTE } from "@/lib/world/cityLayout";
import { streetcarAt, STREETCAR_STOPS } from "@/lib/world/transit";
import { SEASON_DRESSING, type Season } from "@/lib/world/seasons";
import { WORLD_BOUNDS } from "@/lib/world/movement";
import type { SkyPreset } from "./skyPresets";
import { makeWindowTexture, makeDashTexture, makeTextTexture } from "./textures";

const hash01 = (n: number) => Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;

// Vertical layering: enough separation between coplanar layers that nothing
// z-fights at grazing angles.
const Y_PARK = 0.03;
const Y_BOARDWALK = 0.045;
const Y_ROAD = 0.05;
const Y_LAMP_GLOW = 0.075;
const Y_DASH = 0.09;

// ---------------------------------------------------------------------------
// Instanced skyline — one draw call for the towers, one for rooftop clutter.
// ---------------------------------------------------------------------------

function Buildings({ preset }: { readonly preset: SkyPreset }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);

  const rooftops = useMemo(
    () =>
      BUILDINGS.filter((b) => b.height > 15).flatMap((b) => {
        const penthouse = {
          x: b.x + (b.tint - 0.5) * b.width * 0.3,
          z: b.z + (0.5 - b.tint) * b.depth * 0.3,
          y: b.height + 0.8,
          sx: b.width * 0.35,
          sy: 1.6,
          sz: b.depth * 0.35,
        };
        const antenna =
          b.tint > 0.62
            ? [{ x: b.x, z: b.z, y: b.height + 2.2, sx: 0.18, sy: 4.4, sz: 0.18 }]
            : [];
        return [penthouse, ...antenna];
      }),
    [],
  );

  const { geometry, materials, facade } = useMemo(() => {
    const windowTexture = makeWindowTexture(0.45, "#151d2e");
    const facadeMaterial = new THREE.MeshStandardMaterial({
      map: windowTexture,
      emissiveMap: windowTexture,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.85,
      roughness: 0.85,
    });
    const roof = new THREE.MeshStandardMaterial({ color: "#242b3b", roughness: 0.95 });
    return {
      geometry: new THREE.BoxGeometry(1, 1, 1),
      // Box face order: +x, -x, +y, -y, +z, -z — windows on walls, plain roof.
      materials: [facadeMaterial, facadeMaterial, roof, roof, facadeMaterial, facadeMaterial],
      facade: facadeMaterial,
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- three.js material params are tuned imperatively
    facade.emissiveIntensity = preset.windowGlow;
  }, [facade, preset.windowGlow]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      facade.map?.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [geometry, materials, facade]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const base = new THREE.Color("#46536e");
    const accent = new THREE.Color("#66789e");
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

    const roofMesh = roofRef.current;
    if (!roofMesh) return;
    rooftops.forEach((item, i) => {
      dummy.position.set(item.x, item.y, item.z);
      dummy.scale.set(item.sx, item.sy, item.sz);
      dummy.updateMatrix();
      roofMesh.setMatrixAt(i, dummy.matrix);
    });
    roofMesh.instanceMatrix.needsUpdate = true;
  }, [rooftops]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geometry, materials, BUILDINGS.length]} />
      <instancedMesh ref={roofRef} args={[undefined, undefined, rooftops.length]}>
        <boxGeometry />
        <meshStandardMaterial color="#333c50" roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Roads with dashed center lines.
// ---------------------------------------------------------------------------

function Roads({ preset }: { readonly preset: SkyPreset }) {
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
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_ROAD, 0]}>
              <planeGeometry args={[length, road.width]} />
              <meshStandardMaterial color={preset.road} roughness={0.95} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_DASH, 0]}>
              <planeGeometry args={[length, 0.35]} />
              <meshBasicMaterial map={dash} transparent opacity={0.75} depthWrite={false} />
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
  const rollsign = useMemo(
    () => makeTextTexture("501 QUEEN", { fontSize: 60, color: "#ffb300" }),
    [],
  );
  useEffect(() => () => rollsign.dispose(), [rollsign]);

  // Position comes from the same pure function the ride mechanic uses, so the
  // car you see is exactly the car you can board.
  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || prefersReduced) return;
    const car = streetcarAt(clock.elapsedTime);
    group.position.x = car.x;
    group.rotation.y = car.direction > 0 ? 0 : Math.PI;
  });

  return (
    <group ref={groupRef} position={[10, 0, STREETCAR_ROUTE.z]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[7, 1.9, 2.2]} />
        <meshStandardMaterial color="#c8102e" roughness={0.5} />
      </mesh>
      {/* rounded nose */}
      <mesh position={[3.5, 1.05, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 1.8, 20, 1, false, 0, Math.PI]} />
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
        <sphereGeometry args={[0.16, 14, 12]} />
        <meshBasicMaterial color="#fff6d8" />
      </mesh>
      {/* rollsigns, front and curb side */}
      <mesh position={[3.95, 1.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.3, 0.3]} />
        <meshBasicMaterial map={rollsign} transparent />
      </mesh>
      <mesh position={[2.4, 1.85, 1.13]}>
        <planeGeometry args={[1.3, 0.3]} />
        <meshBasicMaterial map={rollsign} transparent />
      </mesh>
      <mesh position={[0, Y_ROAD + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.4, 2.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Lamps, trees, sky, water.
// ---------------------------------------------------------------------------

const LAMP_ROADS = ["Queen St W", "Front St W", "Dundas St W", "College St", "Yonge St"];

function StreetLamps({ preset }: { readonly preset: SkyPreset }) {
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
            <cylinderGeometry args={[0.06, 0.09, 3.2, 8]} />
            <meshStandardMaterial color="#2a303c" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.3, 0]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshBasicMaterial color={preset.lampsOn ? "#ffd9a0" : "#4a5060"} />
          </mesh>
          {preset.lampsOn && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_LAMP_GLOW, 0]}>
              <circleGeometry args={[2.4, 20]} />
              <meshBasicMaterial
                color="#ffd9a0"
                transparent
                opacity={0.07}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

const TREE_SPOTS: readonly { x: number; z: number }[] = [
  // Queen's Park oval
  { x: -43, z: -66 }, { x: -42, z: -74 }, { x: -18, z: -66 }, { x: -19, z: -74 },
  { x: -36, z: -64.5 }, { x: -24, z: -64.5 }, { x: -30, z: -77.5 }, { x: -44, z: -70 },
  { x: -16, z: -70 },
  // U of T campus
  { x: -48, z: -66.5 }, { x: -45, z: -77 }, { x: -55, z: -68 }, { x: -37, z: -72 },
  // Nathan Phillips Square
  { x: -28, z: -16 }, { x: -11, z: -18 }, { x: -28, z: -24 },
  // waterfront promenade
  { x: -48, z: 50 }, { x: -30, z: 49.5 }, { x: -20, z: 50 }, { x: 24, z: 49.5 },
  { x: 36, z: 50 }, { x: 52, z: 49.5 }, { x: 66, z: 48 },
  // scattered street trees
  { x: 66, z: 24 }, { x: 60, z: 14 }, { x: -74, z: -31 }, { x: -66, z: -55 }, { x: -68, z: 34 },
];

/** Streetcar stop poles along Queen — where you can flag down the 501. */
function StreetcarStops() {
  return (
    <group>
      {STREETCAR_STOPS.map((stop) => (
        <group key={stop.name} position={[stop.x, 0, STREETCAR_ROUTE.z + 2.6]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
            <meshStandardMaterial color="#3a4150" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.05, 0]}>
            <boxGeometry args={[0.7, 0.5, 0.08]} />
            <meshStandardMaterial
              color="#c8102e"
              emissive="#c8102e"
              emissiveIntensity={0.35}
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Trees({ season }: { readonly season: Season }) {
  const dressing = SEASON_DRESSING[season];
  return (
    <group>
      {TREE_SPOTS.map((spot, i) => {
        const scale = 0.85 + hash01(i) * 0.5;
        const conifer = i % 3 === 0;
        return (
          <group key={i} position={[spot.x, 0, spot.z]} scale={scale}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.11, 0.2, 1.1, 8]} />
              <meshStandardMaterial color="#4a3826" roughness={0.9} />
            </mesh>
            {conifer ? (
              <>
                {/* conifers keep their needles all year */}
                <mesh position={[0, 1.6, 0]}>
                  <coneGeometry args={[0.85, 1.7, 12]} />
                  <meshStandardMaterial color="#25503a" roughness={0.85} />
                </mesh>
                <mesh position={[0, 2.5, 0]}>
                  <coneGeometry args={[0.55, 1.2, 12]} />
                  <meshStandardMaterial color="#2c5f44" roughness={0.85} />
                </mesh>
                {dressing.snow && (
                  <mesh position={[0, 2.85, 0]}>
                    <coneGeometry args={[0.42, 0.5, 12]} />
                    <meshStandardMaterial color="#e8eef5" roughness={0.9} />
                  </mesh>
                )}
              </>
            ) : (
              <>
                <mesh position={[0, 1.75, 0]}>
                  <sphereGeometry args={[0.85, 16, 12]} />
                  <meshStandardMaterial color={dressing.foliage} roughness={0.85} />
                </mesh>
                <mesh position={[0.45, 2.2, 0.15]}>
                  <sphereGeometry args={[0.5, 14, 10]} />
                  <meshStandardMaterial color={dressing.foliage} roughness={0.85} />
                </mesh>
                <mesh position={[-0.4, 2.15, -0.15]}>
                  <sphereGeometry args={[0.45, 14, 10]} />
                  <meshStandardMaterial color={dressing.foliage} roughness={0.85} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Sky({ preset }: { readonly preset: SkyPreset }) {
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
      {preset.showStars && (
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
      )}
      {preset.showMoon && (
        <group>
          <mesh position={[58, 74, -130]}>
            <circleGeometry args={[7, 40]} />
            <meshBasicMaterial color="#f2eedd" fog={false} />
          </mesh>
          <mesh position={[58, 74, -129.5]}>
            <circleGeometry args={[11, 40]} />
            <meshBasicMaterial color="#f2eedd" transparent opacity={0.12} fog={false} />
          </mesh>
        </group>
      )}
      {preset.sunDisc && (
        <group position={[...preset.sunDisc.position]} rotation={[0, Math.atan2(preset.sunDisc.position[0], preset.sunDisc.position[2]) + Math.PI, 0]}>
          <mesh>
            <circleGeometry args={[preset.sunDisc.radius, 40]} />
            <meshBasicMaterial color={preset.sunDisc.color} fog={false} />
          </mesh>
          <mesh position={[0, 0, -0.5]}>
            <circleGeometry args={[preset.sunDisc.radius * 1.7, 40]} />
            <meshBasicMaterial color={preset.sunDisc.color} transparent opacity={0.15} fog={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Lake({ preset }: { readonly preset: SkyPreset }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, LAKE_EDGE_Z + 25]}>
        <planeGeometry args={[190, 60]} />
        <meshStandardMaterial color={preset.lake} roughness={0.25} metalness={0.4} />
      </mesh>
      {/* light glint on the water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[45, 0.01, LAKE_EDGE_Z + 18]}>
        <planeGeometry args={[10, 34]} />
        <meshBasicMaterial color={preset.lakeGlint} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      {/* Toronto Islands, a silhouette across the harbour */}
      <mesh position={[20, 0.4, LAKE_EDGE_Z + 22]}>
        <boxGeometry args={[54, 1, 6]} />
        <meshStandardMaterial color="#17212c" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

type CitySceneProps = {
  readonly prefersReduced: boolean;
  readonly preset: SkyPreset;
  readonly season: Season;
};

/** Everything that makes it Toronto except the landmark set pieces. */
export default function CityScene({ prefersReduced, preset, season }: CitySceneProps) {
  const dressing = SEASON_DRESSING[season];
  // Winter whitens the parks; other seasons follow the time-of-day grade.
  const parkColor = dressing.snow ? dressing.park : preset.park;
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -12]}>
        <planeGeometry args={[190, 160]} />
        <meshStandardMaterial color={preset.ground} roughness={1} />
      </mesh>
      {/* campus green (Queen's Park's lawn lives with its landmark) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-46, Y_PARK, -71]}>
        <planeGeometry args={[22, 15]} />
        <meshStandardMaterial color={parkColor} roughness={1} />
      </mesh>
      {/* Grange Park, between the AGO and OCAD */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-45, Y_PARK, -22.5]}>
        <planeGeometry args={[13, 5]} />
        <meshStandardMaterial color={parkColor} roughness={1} />
      </mesh>
      {/* waterfront boardwalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_BOARDWALK, (WORLD_BOUNDS.maxZ + LAKE_EDGE_Z) / 2 - 2]}>
        <planeGeometry args={[160, 8]} />
        <meshStandardMaterial color="#33291d" roughness={0.95} />
      </mesh>
      <Roads preset={preset} />
      <Buildings preset={preset} />
      <StreetLamps preset={preset} />
      <Trees season={season} />
      <StreetcarStops />
      <Streetcar prefersReduced={prefersReduced} />
      <Lake preset={preset} />
      <Sky preset={preset} />
    </group>
  );
}
